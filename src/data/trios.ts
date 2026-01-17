import { GamePair } from "@/lib/types";

/**
 * Trios (3 simultaneous conversations) for extreme mode only.
 *
 * Same design philosophies as pairs, but with an extra situationC
 * to increase difficulty and chaos.
 */
export const trios: GamePair[] = [
  {
    id: "triple-work-chaos",
    difficulty: "hard",
    theme: "confusable",
    situationA: {
      id: "project-update",
      topic: "work",
      tone: "formal",
      intent: "asking_for_update",
      personName: "Patricia",
      personContext: "Your project manager",
      facts: [
        "Project deadline is Friday",
        "You are working on the frontend",
      ],
      initialTranscript: [
        { role: "them", text: "Hi, quick check-in on the project." },
        { role: "them", text: "How's progress looking for Friday?" },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "intern-question",
      topic: "work",
      tone: "casual",
      intent: "asking_for_help",
      personName: "Kevin",
      personContext: "The summer intern on your team",
      facts: [
        "Kevin is 20 years old",
        "Kevin is nervous about making mistakes",
      ],
      initialTranscript: [
        { role: "them", text: "Hey sorry to bother you" },
        {
          role: "them",
          text: "I think I accidentally deleted something important?? 😰",
        },
      ],
      difficultyTags: ["medium"],
    },
    situationC: {
      id: "coworker-resignation",
      topic: "work",
      tone: "serious",
      intent: "confiding",
      personName: "Rachel",
      personContext: "Your work friend",
      facts: [
        "Rachel has been unhappy at work",
        "Rachel just got another offer",
      ],
      initialTranscript: [
        { role: "them", text: "Can you keep this between us for now?" },
        { role: "them", text: "I'm putting in my two weeks tomorrow" },
      ],
      difficultyTags: ["medium"],
    },
  },
  {
    id: "triple-social-spiral",
    difficulty: "medium",
    theme: "confusable",
    situationA: {
      id: "dinner-plans",
      topic: "social",
      tone: "casual",
      intent: "making_plans",
      personName: "Taylor",
      personContext: "Your friend who loves trying new restaurants",
      facts: [
        "There's a new Thai place downtown",
        "You and Taylor are both free this weekend",
      ],
      initialTranscript: [
        { role: "them", text: "That new Thai place opened!" },
        { role: "them", text: "Want to check it out Saturday?" },
      ],
      difficultyTags: ["easy"],
    },
    situationB: {
      id: "concert-invite",
      topic: "entertainment",
      tone: "excited",
      intent: "inviting",
      personName: "Blake",
      personContext: "Your friend with similar music taste",
      facts: [
        "Your favorite band is coming to town",
        "Blake has two tickets",
      ],
      initialTranscript: [
        { role: "them", text: "GUESS WHO GOT TICKETS?! 🎸" },
        { role: "them", text: "You're coming with me right??" },
      ],
      difficultyTags: ["easy"],
    },
    situationC: {
      id: "karaoke-night",
      topic: "entertainment",
      tone: "excited",
      intent: "inviting",
      personName: "Lisa",
      personContext: "Your coworker who loves karaoke",
      facts: ["Team is going out tonight", "Lisa wants you to join"],
      initialTranscript: [
        { role: "them", text: "KARAOKE TONIGHT!!! 🎤" },
        {
          role: "them",
          text: "The whole team is going. You're coming right??",
        },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "triple-family-storm",
    difficulty: "hard",
    theme: "confusable",
    situationA: {
      id: "parent-visit",
      topic: "family",
      tone: "concerned",
      intent: "making_demands",
      personName: "Mom",
      personContext: "Your mother",
      facts: [
        "Mom wants to visit next month",
        "You are very busy with work",
      ],
      initialTranscript: [
        {
          role: "them",
          text: "I'm booking flights to come see you next month",
        },
        { role: "them", text: "You'll make time for your mother, won't you?" },
      ],
      difficultyTags: ["hard"],
    },
    situationB: {
      id: "sibling-rivalry",
      topic: "family",
      tone: "playful",
      intent: "competing",
      personName: "Matt",
      personContext: "Your competitive older brother",
      facts: [
        "You and Matt both play the same mobile game",
        "Matt just beat your high score",
      ],
      initialTranscript: [
        { role: "them", text: "Check the leaderboard 😎" },
        { role: "them", text: "Your little record didn't last long did it" },
      ],
      difficultyTags: ["easy"],
    },
    situationC: {
      id: "aunt-gossip",
      topic: "family",
      tone: "playful",
      intent: "sharing_gossip",
      personName: "Aunt Linda",
      personContext: "Your aunt who knows everyone's business",
      facts: [
        "Aunt Linda just came back from a family gathering",
        "Aunt Linda has 'news' to share",
      ],
      initialTranscript: [
        {
          role: "them",
          text: "You will NOT believe what your cousin did at Thanksgiving",
        },
        { role: "them", text: "I'm still in shock honestly" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "triple-romance-maze",
    difficulty: "hard",
    theme: "narrative",
    situationA: {
      id: "date-followup",
      topic: "dating",
      tone: "flirty",
      intent: "showing_interest",
      personName: "Robin",
      personContext: "Someone you went on a first date with",
      facts: ["You and Robin had dinner last night", "It went well"],
      initialTranscript: [
        { role: "them", text: "I had a really great time last night 😊" },
        { role: "them", text: "Would love to do it again sometime" },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "ex-text",
      topic: "relationships",
      tone: "serious",
      intent: "reconnecting",
      personName: "Nathan",
      personContext: "Your ex from 2 years ago",
      facts: [
        "The breakup was mutual",
        "You and Nathan haven't spoken since",
      ],
      initialTranscript: [
        { role: "them", text: "Hey, I know this is random" },
        { role: "them", text: "But I've been thinking about you lately" },
      ],
      difficultyTags: ["hard"],
    },
    situationC: {
      id: "coworker-crush",
      topic: "work",
      tone: "playful",
      intent: "gossiping",
      personName: "Denise",
      personContext: "Your work friend",
      facts: [
        "You and Denise both noticed James has been extra friendly to you",
        "Denise is teasing you about it",
      ],
      initialTranscript: [
        {
          role: "them",
          text: "So... did you see how James looked at you in the meeting??",
        },
        { role: "them", text: "Don't even try to deny it lol" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "triple-life-updates",
    difficulty: "easy",
    theme: "confusable",
    situationA: {
      id: "friend-checkin-1",
      topic: "friendship",
      tone: "casual",
      intent: "checking_in",
      personName: "Alex",
      personContext: "Your close friend from college",
      facts: [
        "You and Alex haven't seen each other in 2 weeks",
        "Alex just got back from vacation",
      ],
      initialTranscript: [
        { role: "them", text: "Hey! Finally back from Bali 🌴" },
        { role: "them", text: "How have you been??" },
      ],
      difficultyTags: ["easy"],
    },
    situationB: {
      id: "friend-checkin-2",
      topic: "friendship",
      tone: "casual",
      intent: "checking_in",
      personName: "Jordan",
      personContext: "Your gym buddy",
      facts: [
        "You and Jordan both go to the same gym",
        "Jordan missed the last few sessions",
      ],
      initialTranscript: [
        { role: "them", text: "yo! missed you at the gym lately" },
        { role: "them", text: "everything good?" },
      ],
      difficultyTags: ["easy"],
    },
    situationC: {
      id: "childhood-friend",
      topic: "friendship",
      tone: "excited",
      intent: "reconnecting",
      personName: "Maria",
      personContext: "Your best friend from elementary school",
      facts: [
        "You and Maria haven't seen each other in 10 years",
        "Maria found you on social media",
      ],
      initialTranscript: [
        { role: "them", text: "OMG IS THIS REALLY YOU??" },
        {
          role: "them",
          text: "Remember when we used to build forts in your backyard?!",
        },
      ],
      difficultyTags: ["easy"],
    },
  },
];

export default trios;
