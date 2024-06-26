import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { Button, Grid } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { getHotkeyHandler } from '@mantine/hooks';
import { StimulusParams } from '../../store/types';
import { useCurrentStep } from '../../routes/utils';
import { useNextStep } from '../../store/hooks/useNextStep';
import { useFlatSequence } from '../../store/store';

function Ranking({ rankings }: { rankings: number[] }) {
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div>
        {rankings.map((item, idx) => (
          <div
            key={idx}
            style={{
              textAlign: 'center',
              marginBottom: 1,
              padding: 2,
              background: `${item === 0 ? '#AEC7E8' : '#FF9896'}`,
            }}
          >
            {item === 0 ? 'Group A' : 'Group B'}
          </div>
        ))}
      </div>
    </div>
  );
}

function FairnessJND({
  parameters,
  setAnswer,
}: StimulusParams<{
  data: { r1: number[]; r2: number[]; r1ARP: string; r2ARP: string };
}>) {
  const currentStep = useCurrentStep();
  const id = useFlatSequence()[currentStep];
  const [userChoice, setUserChoice] = useState('');

  const { goToNextStep, isNextDisabled } = useNextStep();

  const left = useMemo(
    () => (Math.floor(Math.random() * 2) === 0 ? 'r1' : 'r2'),
    [],
  );

  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const isAdmin = (searchParams.get('admin') || 'f') === 't';

  const updateAnswer = useCallback(
    (choice: string) => {
      setUserChoice(choice); // left or right
      setAnswer({
        status: true,
        answers: {
          [`${id}/leftARP`]:
            left === 'r1' ? parameters.data.r1ARP : parameters.data.r2ARP,
          [`${id}/rightARP`]:
            left === 'r2' ? parameters.data.r1ARP : parameters.data.r2ARP,
          [`${id}/leftRanking`]: JSON.stringify(
            left === 'r1' ? parameters.data.r1 : parameters.data.r2,
          ),
          [`${id}/rightRanking`]: JSON.stringify(
            left === 'r2' ? parameters.data.r1 : parameters.data.r2,
          ),
          [`${id}/choice`]: choice,
          [`${id}/correctChoice`]:
            left === 'r1'
            && parseFloat(parameters.data.r1ARP)
              < parseFloat(parameters.data.r2ARP)
              ? 'left'
              : 'right',
        },
      });
    },
    [id, left, parameters.data, setAnswer],
  );

  const handleNextStimuli = useCallback(() => {
    if (!isNextDisabled) {
      goToNextStep();
    }
  }, [isNextDisabled, goToNextStep]);

  useEffect(() => {
    const ev = getHotkeyHandler([
      ['ArrowLeft', () => updateAnswer('left')],
      ['ArrowRight', () => updateAnswer('right')],
      ['Enter', handleNextStimuli],
    ]);

    document.body.addEventListener('keydown', ev);

    return () => {
      document.body.removeEventListener('keydown', ev);
    };
  }, [updateAnswer, handleNextStimuli]);

  let isUserChoiceCorrect = false;

  if (left === 'r1') {
    if (
      (userChoice === 'left'
        && parseFloat(parameters.data.r1ARP)
          < parseFloat(parameters.data.r2ARP))
      || (userChoice === 'right'
        && parseFloat(parameters.data.r2ARP) < parseFloat(parameters.data.r1ARP))
    ) {
      isUserChoiceCorrect = true;
    }
  } else if (
    (userChoice === 'left'
        && parseFloat(parameters.data.r2ARP)
          < parseFloat(parameters.data.r1ARP))
      || (userChoice === 'right'
        && parseFloat(parameters.data.r1ARP) < parseFloat(parameters.data.r2ARP))
  ) {
    isUserChoiceCorrect = true;
  }

  return (
    <div>
      <Grid>
        <Grid.Col span={2}>
          <Ranking
            rankings={left === 'r1' ? parameters.data.r1 : parameters.data.r2}
          />

          <Button
            fullWidth
            disabled={userChoice === 'left'}
            onClick={() => {
              updateAnswer('left');
            }}
          >
            {userChoice === 'left' ? (
              <IconCircleCheck />
            ) : (
              'Select this ranking'
            )}
          </Button>
          {isAdmin && userChoice && (
            <div>
              {left === 'r1' ? parameters.data.r1ARP : parameters.data.r2ARP}
            </div>
          )}
        </Grid.Col>
        <Grid.Col span={2}>
          <Ranking
            rankings={left === 'r1' ? parameters.data.r2 : parameters.data.r1}
          />
          <Button
            fullWidth
            disabled={userChoice === 'right'}
            onClick={() => {
              updateAnswer('right');
            }}
          >
            {userChoice === 'right' ? (
              <IconCircleCheck />
            ) : (
              'Select this ranking'
            )}
          </Button>
          {isAdmin && userChoice && (
            <div>
              {left === 'r1' ? parameters.data.r2ARP : parameters.data.r1ARP}
            </div>
          )}
        </Grid.Col>
      </Grid>

      {isAdmin && userChoice && (
        <div style={{ padding: 20, textAlign: 'center', width: 300 }}>
          {isUserChoiceCorrect ? 'CORRECT' : 'INCORRECT'}
        </div>
      )}
    </div>
  );
}

export default FairnessJND;
