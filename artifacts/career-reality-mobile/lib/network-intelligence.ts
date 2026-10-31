export type NetworkResponse = 'warm' | 'possible' | 'unknown' | 'none';

export type NetworkDimension = {
  key: string;
  title: string;
  question: string;
  detail: string;
};

export const networkDimensions: NetworkDimension[] = [
  {
    key: 'connection',
    title: 'Warm connection',
    question: 'Can you name someone who could credibly introduce you?',
    detail: 'A real person and a specific context are stronger than a large follower count.',
  },
  {
    key: 'recruiter',
    title: 'Recruiter signal',
    question: 'Has a recruiter shared a specific role, process, or next step?',
    detail: 'Specificity and follow-through are evidence. Generic outreach is not yet a signal.',
  },
  {
    key: 'sponsor',
    title: 'Internal sponsor',
    question: 'Would someone inside the target company vouch for your work?',
    detail: 'Look for a person who has seen your impact, not only someone who knows your name.',
  },
  {
    key: 'recency',
    title: 'Recent contact',
    question: 'Have you had a useful conversation with this person recently?',
    detail: 'Old ties can still help, but the next move should refresh the context before asking for a referral.',
  },
];

export const networkResponseOptions: Array<{
  value: NetworkResponse;
  label: string;
  detail: string;
}> = [
  { value: 'warm', label: 'Yes, with evidence', detail: 'I can name the person and why they know my work.' },
  { value: 'possible', label: 'Maybe', detail: 'There is a path, but I need to refresh or qualify it.' },
  { value: 'unknown', label: 'Not enough evidence', detail: 'I should check before assuming access.' },
  { value: 'none', label: 'Not currently', detail: 'I do not have a credible path yet.' },
];

export type NetworkResponses = Record<string, NetworkResponse>;

export type NetworkAnalysis = {
  tone: 'positive' | 'warning' | 'accent';
  label: string;
  title: string;
  body: string;
  known: string;
  unknowns: string[];
  nextMove: {
    title: string;
    body: string;
  };
  unknownCount: number;
  warmCount: number;
};

export function getDefaultNetworkResponses(): NetworkResponses {
  return Object.fromEntries(networkDimensions.map((dimension) => [dimension.key, 'unknown'])) as NetworkResponses;
}

export function analyzeNetworkIntelligence(responses: NetworkResponses): NetworkAnalysis {
  const unknownCount = networkDimensions.filter((dimension) => responses[dimension.key] === 'unknown').length;
  const warmCount = networkDimensions.filter((dimension) => responses[dimension.key] === 'warm').length;
  const hasRecruiterSpecificity = responses.recruiter === 'warm';
  const hasConnection = responses.connection === 'warm' || responses.sponsor === 'warm';

  if (unknownCount >= 2) {
    return {
      tone: 'warning',
      label: 'Evidence gap',
      title: 'Your access is not clear enough to plan around yet.',
      body: 'Do not treat silence, a large network, or a recruiter message as access. Verify one relationship and one specific next step before investing heavily.',
      known: 'This read is based only on what you observed and entered here—not a lookup of your private network.',
      unknowns: ['You have not confirmed who would respond.', 'You have not confirmed which person has seen your work.', 'Recruiter intent and hiring timing remain unverified.'],
      nextMove: {
        title: 'Refresh one relationship with context',
        body: 'Send a short update about the kind of role you are exploring and ask whether they would be open to a 15-minute reality check.',
      },
      unknownCount,
      warmCount,
    };
  }

  if (hasConnection && hasRecruiterSpecificity) {
    return {
      tone: 'positive',
      label: 'Warm path',
      title: 'You have enough signal to make a specific ask.',
      body: 'This is not a promise of an interview. It is a better-than-cold starting point because the relationship and role context are both more concrete.',
      known: 'A person and a specific role or process are present in your observed signals.',
      unknowns: ['The person may not have influence over the final decision.', 'The role may change or close before you are considered.'],
      nextMove: {
        title: 'Make one bounded referral ask',
        body: 'Share the role, your two strongest proof points, and the exact help you want: context, referral, or a correction to your positioning.',
      },
      unknownCount,
      warmCount,
    };
  }

  return {
    tone: 'accent',
    label: 'Path to test',
    title: 'There is a possible path, but it needs a clearer next signal.',
    body: 'Use the next conversation to learn whether the person knows your work, understands the role, and is willing to help—not to collect more contacts.',
    known: 'At least one relationship or recruiter signal is present, but the path is not specific enough to call warm.',
    unknowns: ['The strength of the relationship is still partly assumed.', 'The recruiter or employee may not be close to the decision.'],
    nextMove: {
      title: 'Ask for context before asking for access',
      body: 'Ask what the team actually values in this role and whether your background maps to it. Use the answer to sharpen your application or decide not to pursue it.',
    },
    unknownCount,
    warmCount,
  };
}