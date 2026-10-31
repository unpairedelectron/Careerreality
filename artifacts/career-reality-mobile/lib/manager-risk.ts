export type RiskResponse = 'steady' | 'mixed' | 'concern' | 'unknown';

export type RiskDimension = {
  key: string;
  group: 'manager' | 'team';
  title: string;
  question: string;
  detail: string;
};

export const managerRiskDimensions: RiskDimension[] = [
  {
    key: 'expectations',
    group: 'manager',
    title: 'Expectations',
    question: 'Are success criteria and priorities explicit before the work starts?',
    detail: 'Look for written priorities, decision ownership, and a definition of done—not just urgent requests.',
  },
  {
    key: 'feedback',
    group: 'manager',
    title: 'Feedback',
    question: 'Do you get actionable feedback before review or promotion decisions?',
    detail: 'A healthy pattern names the gap, gives you a chance to respond, and does not rely on surprise.',
  },
  {
    key: 'visibility',
    group: 'manager',
    title: 'Visibility and credit',
    question: 'Does your manager make your impact visible to the people who decide?',
    detail: 'Credit is not praise; it is accurate attribution, context, and access to the next conversation.',
  },
  {
    key: 'speakUp',
    group: 'manager',
    title: 'Speaking up',
    question: 'Can you disagree or surface risk without being punished for the message?',
    detail: 'Notice what happens after a difficult truth—not only what is said during a calm one-to-one.',
  },
  {
    key: 'ownership',
    group: 'team',
    title: 'Ownership',
    question: 'Are team decisions and handoffs clear enough to protect your work?',
    detail: 'Ambiguous ownership creates invisible work, duplicated effort, and blame without learning.',
  },
  {
    key: 'workload',
    group: 'team',
    title: 'Workload and stability',
    question: 'Is the team’s workload sustainable without constant emergency mode?',
    detail: 'Look for recurring late work, unfilled ownership, shifting priorities, and whether capacity is discussed openly.',
  },
];

export const managerRiskResponseOptions: Array<{
  value: RiskResponse;
  label: string;
  detail: string;
}> = [
  { value: 'steady', label: 'Consistently true', detail: 'I can point to recent evidence.' },
  { value: 'mixed', label: 'Mixed pattern', detail: 'It depends on the person or situation.' },
  { value: 'concern', label: 'Not true recently', detail: 'I have a concrete concern to test.' },
  { value: 'unknown', label: 'Not enough evidence', detail: 'I should observe or ask before concluding.' },
];

export type ManagerRiskResponses = Record<string, RiskResponse>;

export type ManagerRiskAnalysis = {
  tone: 'positive' | 'warning' | 'accent';
  label: string;
  title: string;
  body: string;
  nextMove: {
    title: string;
    body: string;
  };
  unknownCount: number;
  managerConcernCount: number;
  teamConcernCount: number;
};

export function getDefaultManagerRiskResponses(): ManagerRiskResponses {
  return Object.fromEntries(managerRiskDimensions.map((dimension) => [dimension.key, 'unknown'])) as ManagerRiskResponses;
}

export function analyzeManagerRisk(responses: ManagerRiskResponses): ManagerRiskAnalysis {
  const unknownCount = managerRiskDimensions.filter((dimension) => responses[dimension.key] === 'unknown').length;
  const managerConcernCount = managerRiskDimensions.filter((dimension) => dimension.group === 'manager' && responses[dimension.key] === 'concern').length;
  const teamConcernCount = managerRiskDimensions.filter((dimension) => dimension.group === 'team' && responses[dimension.key] === 'concern').length;
  const totalConcernCount = managerConcernCount + teamConcernCount;

  if (unknownCount >= 3) {
    return {
      tone: 'warning',
      label: 'Evidence gap',
      title: 'You do not have enough observable evidence yet.',
      body: 'Do not turn uncertainty into either loyalty or fear. Ask one specific question, observe the response, and record what changes afterward.',
      nextMove: {
        title: 'Run one manager or team clarity check',
        body: 'Choose the most important unknown. Ask for one concrete example, owner, or decision date, then note whether the follow-through matches the answer.',
      },
      unknownCount,
      managerConcernCount,
      teamConcernCount,
    };
  }

  if (managerConcernCount >= 2) {
    return {
      tone: 'warning',
      label: 'Manager pattern to test',
      title: 'The manager relationship is carrying the clearest risk signal.',
      body: 'This is not a verdict about intent. It is a reason to test feedback, visibility, and psychological safety with one bounded conversation and a written follow-up.',
      nextMove: {
        title: 'Ask for a written expectations check-in',
        body: 'Ask your manager what success looks like, what evidence is missing, and when you will review progress. Send a short recap so the pattern becomes observable.',
      },
      unknownCount,
      managerConcernCount,
      teamConcernCount,
    };
  }

  if (teamConcernCount >= 2) {
    return {
      tone: 'warning',
      label: 'Team operating risk',
      title: 'The team system may be creating avoidable career risk.',
      body: 'Unclear ownership and unsustainable workload can hide impact, increase blame, and make a strong individual look unreliable. Test the system before blaming yourself.',
      nextMove: {
        title: 'Make ownership and capacity visible',
        body: 'Write down the next two decisions, owners, dependencies, and trade-offs. Ask the team to confirm what will stop or move if capacity does not change.',
      },
      unknownCount,
      managerConcernCount,
      teamConcernCount,
    };
  }

  if (totalConcernCount === 0) {
    return {
      tone: 'positive',
      label: 'Manageable for now',
      title: 'No immediate pattern is asking you to escalate.',
      body: 'Keep the evidence current. Healthy conditions can change quietly, so protect the relationship with clear expectations, visible impact, and regular check-ins.',
      nextMove: {
        title: 'Protect the healthy pattern',
        body: 'Record one recent outcome, one decision you own, and the next check-in date so your manager and team context stays visible as priorities change.',
      },
      unknownCount,
      managerConcernCount,
      teamConcernCount,
    };
  }

  return {
    tone: 'accent',
    label: 'Mixed pattern',
    title: 'There is a signal worth testing, not a conclusion to fear.',
    body: 'Some conditions are working and some are not. Focus on the single concern with the highest cost to your next move, then look for a response you can verify.',
    nextMove: {
      title: 'Test the highest-cost concern',
      body: 'Pick one concern that affects your work or progression most. Ask for a concrete change, owner, or date, and review what actually happens in two weeks.',
    },
    unknownCount,
    managerConcernCount,
    teamConcernCount,
  };
}