import { GamePair } from "@/lib/types";

/**
 * Curated game pairs with embedded situation data.
 *
 * Design philosophies:
 * - Confusable: Similar topics/words but different contexts (tricky but fair)
 * - Contrast: Stark tonal/stakes differences (boss + ex, serious + silly)
 * - Narrative: Creates funny/absurd scenarios when mixed up
 *
 * Trios (3 situations) are only used in extreme mode.
 */
export const pairs: GamePair[] = [
  // === EASY: Clear contrast, forgiving pairs ===

  {
    id: "monday-blues",
    difficulty: "easy",
    theme: "contrast",
    situationA: {
      id: "coworker-monday",
      topic: "work",
      tone: "casual",
      intent: "small_talk",
      personName: "Sam",
      personContext: "Your coworker on the same team",
      facts: ["It's Monday morning", "The player and Sam both work remotely"],
      initialTranscript: [
        { role: "them", text: "Monday again 😩" },
        { role: "them", text: "How was your weekend?" },
      ],
      difficultyTags: ["easy"],
    },
    situationB: {
      id: "friend-checkin-1",
      topic: "friendship",
      tone: "casual",
      intent: "checking_in",
      personName: "Alex",
      personContext: "Your close friend from college",
      facts: [
        "The player and Alex haven't seen each other in 2 weeks",
        "Alex just got back from vacation",
      ],
      initialTranscript: [
        { role: "them", text: "Hey! Finally back from Bali 🌴" },
        { role: "them", text: "How have you been??" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "weekend-plans",
    difficulty: "easy",
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
        "The player and Taylor are both free this weekend",
      ],
      initialTranscript: [
        { role: "them", text: "That new Thai place opened!" },
        { role: "them", text: "Want to check it out Saturday?" },
      ],
      difficultyTags: ["easy"],
    },
    situationB: {
      id: "movie-night",
      topic: "entertainment",
      tone: "casual",
      intent: "making_plans",
      personName: "Casey",
      personContext: "Your roommate",
      facts: [
        "The player and Casey share an apartment",
        "Netflix subscription is shared",
      ],
      initialTranscript: [
        { role: "them", text: "movie night tonight?" },
        { role: "them", text: "I heard that new sci-fi one is good" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "neighbor-vs-gym",
    difficulty: "easy",
    theme: "contrast",
    situationA: {
      id: "neighbor-hello",
      topic: "neighborhood",
      tone: "casual",
      intent: "friendly_chat",
      personName: "Mrs. Chen",
      personContext: "Your friendly neighbor",
      facts: [
        "Mrs. Chen lives next door",
        "The player and Mrs. Chen have been neighbors for 2 years",
      ],
      initialTranscript: [
        { role: "them", text: "Oh hello dear!" },
        { role: "them", text: "Lovely weather we're having, isn't it?" },
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
        "The player and Jordan both go to the same gym",
        "Jordan missed the last few sessions",
      ],
      initialTranscript: [
        { role: "them", text: "yo! missed you at the gym lately" },
        { role: "them", text: "everything good?" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "work-vs-play",
    difficulty: "easy",
    theme: "contrast",
    situationA: {
      id: "project-update",
      topic: "work",
      tone: "formal",
      intent: "asking_for_update",
      personName: "Patricia",
      personContext: "Your project manager",
      facts: [
        "Project deadline is Friday",
        "The player is working on the frontend",
      ],
      initialTranscript: [
        { role: "them", text: "Hi, quick check-in on the project." },
        { role: "them", text: "How's progress looking for Friday?" },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "concert-invite",
      topic: "entertainment",
      tone: "excited",
      intent: "inviting",
      personName: "Blake",
      personContext: "Your friend with similar music taste",
      facts: [
        "The player's favorite band is coming to town",
        "Blake has two tickets",
      ],
      initialTranscript: [
        { role: "them", text: "GUESS WHO GOT TICKETS?! 🎸" },
        { role: "them", text: "You're coming with me right??" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "friend-updates",
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
        "The player and Alex haven't seen each other in 2 weeks",
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
        "The player and Jordan both go to the same gym",
        "Jordan missed the last few sessions",
      ],
      initialTranscript: [
        { role: "them", text: "yo! missed you at the gym lately" },
        { role: "them", text: "everything good?" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "food-talk",
    difficulty: "easy",
    theme: "confusable",
    situationA: {
      id: "recipe-share",
      topic: "food",
      tone: "casual",
      intent: "sharing",
      personName: "Grandma",
      personContext: "Your grandmother",
      facts: [
        "Grandma is known for her cooking",
        "The player asked about her famous soup recipe",
      ],
      initialTranscript: [
        { role: "them", text: "I found the recipe you asked about!" },
        { role: "them", text: "Want me to send it over?" },
      ],
      difficultyTags: ["easy"],
    },
    situationB: {
      id: "restaurant-rec",
      topic: "food",
      tone: "casual",
      intent: "seeking_advice",
      personName: "Blake",
      personContext: "Friend looking for date night spot",
      facts: ["Blake has a date this weekend", "Budget is moderate"],
      initialTranscript: [
        { role: "them", text: "Date night this weekend!" },
        { role: "them", text: "Know any good spots? Not too fancy but nice" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "hobby-chat",
    difficulty: "easy",
    theme: "confusable",
    situationA: {
      id: "new-hobby",
      topic: "hobbies",
      tone: "playful",
      intent: "sharing_excitement",
      personName: "Rowan",
      personContext: "A friend who picks up new hobbies often",
      facts: [
        "Rowan just started learning guitar",
        "Rowan is very enthusiastic",
      ],
      initialTranscript: [
        { role: "them", text: "I bought a guitar!! 🎸" },
        { role: "them", text: "I'm gonna be a rock star, just you wait" },
      ],
      difficultyTags: ["easy"],
    },
    situationB: {
      id: "book-recommendation",
      topic: "books",
      tone: "casual",
      intent: "recommending",
      personName: "Ellis",
      personContext: "Your book club friend",
      facts: [
        "The player and Ellis both love thrillers",
        "Ellis just finished a new book",
      ],
      initialTranscript: [
        { role: "them", text: "Just finished the most insane book" },
        { role: "them", text: "You HAVE to read it" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "pet-stories",
    difficulty: "easy",
    theme: "confusable",
    situationA: {
      id: "pet-news",
      topic: "pets",
      tone: "excited",
      intent: "sharing_news",
      personName: "Sage",
      personContext: "Your friend who loves animals",
      facts: [
        "Sage just adopted a puppy",
        "The puppy is a golden retriever named Luna",
      ],
      initialTranscript: [
        { role: "them", text: "I DID IT!! 🐕" },
        { role: "them", text: "Meet Luna! She's coming home tomorrow!" },
      ],
      difficultyTags: ["easy"],
    },
    situationB: {
      id: "dog-walker",
      topic: "pets",
      tone: "casual",
      intent: "updating",
      personName: "Trevor",
      personContext: "Your dog walker",
      facts: [
        "Trevor walks the player's dog Max while the player is at work",
        "Max has been acting weird",
      ],
      initialTranscript: [
        { role: "them", text: "Hey! Just wanted to give you a heads up" },
        {
          role: "them",
          text: "Max was super anxious on the walk today, wouldn't stop whining",
        },
      ],
      difficultyTags: ["medium"],
    },
  },
  {
    id: "media-recs",
    difficulty: "easy",
    theme: "confusable",
    situationA: {
      id: "podcast-share",
      topic: "entertainment",
      tone: "excited",
      intent: "recommending",
      personName: "Casey",
      personContext: "Friend who always finds good podcasts",
      facts: [
        "Casey discovered something new",
        "It's related to the player's interests",
      ],
      initialTranscript: [
        { role: "them", text: "OK you NEED to listen to this podcast" },
        { role: "them", text: "It's exactly the kind of thing you'd love" },
      ],
      difficultyTags: ["easy"],
    },
    situationB: {
      id: "book-recommendation",
      topic: "books",
      tone: "casual",
      intent: "recommending",
      personName: "Ellis",
      personContext: "Your book club friend",
      facts: [
        "The player and Ellis both love thrillers",
        "Ellis just finished a new book",
      ],
      initialTranscript: [
        { role: "them", text: "Just finished the most insane book" },
        { role: "them", text: "You HAVE to read it" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "fitness-friends",
    difficulty: "easy",
    theme: "confusable",
    situationA: {
      id: "gym-progress",
      topic: "fitness",
      tone: "excited",
      intent: "celebrating",
      personName: "Kit",
      personContext: "Your workout partner",
      facts: [
        "Kit has been training for months",
        "Kit just hit a personal record",
      ],
      initialTranscript: [
        { role: "them", text: "I DID IT! New PR today! 💪" },
        { role: "them", text: "All that work finally paid off!" },
      ],
      difficultyTags: ["easy"],
    },
    situationB: {
      id: "marathon-training",
      topic: "fitness",
      tone: "excited",
      intent: "inviting",
      personName: "Nicole",
      personContext: "Your friend who's a runner",
      facts: [
        "Nicole is training for a marathon",
        "Nicole wants a running buddy",
      ],
      initialTranscript: [
        { role: "them", text: "I signed up for the marathon!!" },
        {
          role: "them",
          text: "You should totally do it with me. Training starts next week!",
        },
      ],
      difficultyTags: ["medium"],
    },
  },

  // === MEDIUM: Subtle similarities, requires attention ===

  {
    id: "money-matters",
    difficulty: "medium",
    theme: "confusable",
    situationA: {
      id: "money-owed",
      topic: "money",
      tone: "casual",
      intent: "asking_for_money",
      personName: "Drew",
      personContext: "A friend who owes you money",
      facts: [
        "Drew borrowed $200 from the player last month",
        "Drew said they'd pay the player back last week",
      ],
      initialTranscript: [
        { role: "them", text: "Hey so about that money..." },
        { role: "them", text: "Can I pay you back next month instead?" },
      ],
      difficultyTags: ["hard"],
    },
    situationB: {
      id: "borrow-car",
      topic: "favor",
      tone: "casual",
      intent: "asking_favor",
      personName: "Chris",
      personContext: "Your sibling",
      facts: ["Chris's car is in the shop", "The player has a spare car"],
      initialTranscript: [
        { role: "them", text: "Hey so my car broke down 😭" },
        { role: "them", text: "Any chance I could borrow yours this weekend?" },
      ],
      difficultyTags: ["medium"],
    },
  },
  {
    id: "emotional-whiplash",
    difficulty: "medium",
    theme: "narrative",
    situationA: {
      id: "friend-stressed",
      topic: "support",
      tone: "concerned",
      intent: "venting",
      personName: "Riley",
      personContext: "Your close friend going through a tough time",
      facts: [
        "Riley just had a bad day at work",
        "Riley is feeling overwhelmed",
      ],
      initialTranscript: [
        { role: "them", text: "I can't do this anymore" },
        { role: "them", text: "Everything is just too much right now" },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "crush-hint",
      topic: "dating",
      tone: "playful",
      intent: "testing_waters",
      personName: "Avery",
      personContext: "Someone you've been flirting with",
      facts: [
        "The player and Avery have known each other for a few months",
        "There's mutual attraction",
      ],
      initialTranscript: [
        { role: "them", text: "You know what I realized?" },
        {
          role: "them",
          text: "I always smile when I see your messages pop up",
        },
      ],
      difficultyTags: ["medium"],
    },
  },
  {
    id: "professional-personal",
    difficulty: "medium",
    theme: "contrast",
    situationA: {
      id: "feedback-request",
      topic: "work",
      tone: "formal",
      intent: "requesting_feedback",
      personName: "Michelle",
      personContext: "Your senior colleague",
      facts: [
        "The player recently submitted a proposal",
        "Michelle reviewed it",
      ],
      initialTranscript: [
        { role: "them", text: "I looked over your proposal." },
        { role: "them", text: "Do you have time to discuss some thoughts?" },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "dating-advice",
      topic: "dating",
      tone: "casual",
      intent: "seeking_advice",
      personName: "Tom",
      personContext: "Your friend who's newly single",
      facts: [
        "Tom hasn't dated in 5 years",
        "Tom is nervous about getting back out there",
      ],
      initialTranscript: [
        { role: "them", text: "How do people even date now??" },
        {
          role: "them",
          text: "Apps feel so weird. What do I even put in a bio??",
        },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "family-drama",
    difficulty: "medium",
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
        "The player is very busy with work",
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
      id: "sister-drama",
      topic: "family",
      tone: "stressed",
      intent: "venting",
      personName: "Jessica",
      personContext: "Your younger sister",
      facts: [
        "Jessica is in her senior year of high school",
        "Jessica is fighting with her best friend Sarah",
      ],
      initialTranscript: [
        { role: "them", text: "I literally cannot deal with Sarah anymore" },
        {
          role: "them",
          text: "She's being SO fake and everyone's taking her side",
        },
      ],
      difficultyTags: ["medium"],
    },
  },
  {
    id: "roommate-woes",
    difficulty: "medium",
    theme: "confusable",
    situationA: {
      id: "roommate-issue",
      topic: "living",
      tone: "serious",
      intent: "addressing_problem",
      personName: "Pat",
      personContext: "Your roommate",
      facts: [
        "Pat has been leaving dishes in the sink",
        "This is the third time the player has had to clean up after Pat",
      ],
      initialTranscript: [
        { role: "them", text: "Hey can we talk about the kitchen situation?" },
        { role: "them", text: "I feel like things have been a bit off lately" },
      ],
      difficultyTags: ["hard"],
    },
    situationB: {
      id: "roommate-partner",
      topic: "living",
      tone: "casual",
      intent: "asking_permission",
      personName: "Hannah",
      personContext: "Your roommate",
      facts: [
        "Hannah's boyfriend Jake has been over a lot",
        "Hannah wants Jake to stay more",
      ],
      initialTranscript: [
        {
          role: "them",
          text: "Hey so... Jake and I have been getting more serious",
        },
        {
          role: "them",
          text: "Would you be okay if he stayed over a few nights a week?",
        },
      ],
      difficultyTags: ["hard"],
    },
  },
  {
    id: "tech-troubles",
    difficulty: "medium",
    theme: "confusable",
    situationA: {
      id: "tech-help",
      topic: "tech",
      tone: "casual",
      intent: "asking_for_help",
      personName: "Uncle Bob",
      personContext: "Your uncle who isn't tech-savvy",
      facts: [
        "Uncle Bob got a new phone",
        "Uncle Bob can't figure out how to set it up",
      ],
      initialTranscript: [
        { role: "them", text: "This darn phone is driving me crazy!" },
        { role: "them", text: "How do I get my emails on this thing?" },
      ],
      difficultyTags: ["easy"],
    },
    situationB: {
      id: "parent-tech",
      topic: "tech",
      tone: "casual",
      intent: "asking_for_help",
      personName: "Dad",
      personContext: "Your father who struggles with technology",
      facts: ["Dad got a new smart TV", "Dad can't find the Netflix app"],
      initialTranscript: [
        { role: "them", text: "This TV is driving me nuts" },
        {
          role: "them",
          text: "Where is the Netflix?? I press all the buttons and nothing works",
        },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "job-crossroads",
    difficulty: "medium",
    theme: "confusable",
    situationA: {
      id: "job-offer",
      topic: "career",
      tone: "formal",
      intent: "delivering_good_news",
      personName: "HR Manager",
      personContext: "Recruiter from a company you applied to",
      facts: [
        "The player interviewed last week",
        "The company is offering the player the position",
      ],
      initialTranscript: [
        {
          role: "them",
          text: "Great news! We'd like to offer you the position.",
        },
        { role: "them", text: "Are you still interested in joining our team?" },
      ],
      difficultyTags: ["hard"],
    },
    situationB: {
      id: "career-change",
      topic: "career",
      tone: "serious",
      intent: "seeking_opinion",
      personName: "Parker",
      personContext: "Friend considering a career change",
      facts: [
        "Parker is thinking of leaving tech for teaching",
        "It would mean a pay cut",
      ],
      initialTranscript: [
        { role: "them", text: "I've been thinking about becoming a teacher" },
        { role: "them", text: "Crazy idea or worth pursuing?" },
      ],
      difficultyTags: ["medium"],
    },
  },
  {
    id: "party-planning",
    difficulty: "medium",
    theme: "confusable",
    situationA: {
      id: "surprise-party",
      topic: "social",
      tone: "excited",
      intent: "planning",
      personName: "Ash",
      personContext: "Friend helping plan a surprise party",
      facts: [
        "It's for a mutual friend's birthday",
        "The party is this weekend",
      ],
      initialTranscript: [
        { role: "them", text: "OK the venue is booked!" },
        { role: "them", text: "Can you handle the cake?" },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "baby-shower",
      topic: "social",
      tone: "excited",
      intent: "inviting",
      personName: "Amanda",
      personContext: "Your friend who's expecting",
      facts: [
        "Amanda is due in 3 months",
        "Amanda is planning her baby shower",
      ],
      initialTranscript: [
        {
          role: "them",
          text: "You're officially invited to my baby shower!! 🍼",
        },
        { role: "them", text: "Please say you can make it, I need you there!" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "housing-hunt",
    difficulty: "medium",
    theme: "confusable",
    situationA: {
      id: "apartment-hunting",
      topic: "living",
      tone: "stressed",
      intent: "venting",
      personName: "Skyler",
      personContext: "Friend looking for an apartment",
      facts: [
        "Rent prices are high in the area",
        "Skyler has been searching for weeks",
      ],
      initialTranscript: [
        { role: "them", text: "This apartment search is killing me" },
        { role: "them", text: "Everything is either too expensive or a dump" },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "apartment-showing",
      topic: "living",
      tone: "formal",
      intent: "coordinating",
      personName: "Realtor Linda",
      personContext: "Real estate agent helping you find a place",
      facts: [
        "The player has been looking for apartments",
        "Realtor Linda found something that might work",
      ],
      initialTranscript: [
        {
          role: "them",
          text: "Just listed! 2BR in your budget, great neighborhood",
        },
        {
          role: "them",
          text: "Can you see it tomorrow at 2pm? It won't last long",
        },
      ],
      difficultyTags: ["medium"],
    },
  },
  {
    id: "health-check",
    difficulty: "medium",
    theme: "confusable",
    situationA: {
      id: "health-concern",
      topic: "health",
      tone: "concerned",
      intent: "sharing_worry",
      personName: "Charlie",
      personContext: "Your friend who's been feeling unwell",
      facts: [
        "Charlie has had a persistent cough",
        "Charlie is considering seeing a doctor",
      ],
      initialTranscript: [
        { role: "them", text: "This cough won't go away 😷" },
        { role: "them", text: "Do you think I should see a doctor?" },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "doctor-results",
      topic: "health",
      tone: "formal",
      intent: "informing",
      personName: "Dr. Patel",
      personContext: "Your primary care doctor",
      facts: ["The player had blood work done last week", "Results are in"],
      initialTranscript: [
        { role: "them", text: "Your lab results came back" },
        {
          role: "them",
          text: "Everything looks good, but I'd like to discuss your cholesterol numbers",
        },
      ],
      difficultyTags: ["medium"],
    },
  },
  {
    id: "romance-juggle",
    difficulty: "medium",
    theme: "confusable",
    situationA: {
      id: "date-followup",
      topic: "dating",
      tone: "flirty",
      intent: "showing_interest",
      personName: "Robin",
      personContext: "Someone you went on a first date with",
      facts: ["The player and Robin had dinner last night", "It went well"],
      initialTranscript: [
        { role: "them", text: "I had a really great time last night 😊" },
        { role: "them", text: "Would love to do it again sometime" },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "date-app-match",
      topic: "dating",
      tone: "flirty",
      intent: "testing_waters",
      personName: "Sophia",
      personContext: "Someone you matched with on a dating app",
      facts: [
        "The player and Sophia have been chatting for a few days",
        "Sophia seems genuinely interested",
      ],
      initialTranscript: [
        { role: "them", text: "Okay real talk" },
        {
          role: "them",
          text: "Are you actually as funny in person as you are in text? 😏",
        },
      ],
      difficultyTags: ["medium"],
    },
  },
  {
    id: "work-politics",
    difficulty: "medium",
    theme: "confusable",
    situationA: {
      id: "boss-complaint",
      topic: "work",
      tone: "stressed",
      intent: "venting",
      personName: "Alex",
      personContext: "Coworker frustrated with management",
      facts: ["The player's boss made an unfair decision", "Alex is fed up"],
      initialTranscript: [
        {
          role: "them",
          text: "I cannot BELIEVE what just happened in that meeting",
        },
        { role: "them", text: "How is this okay??" },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "coworker-boundary",
      topic: "work",
      tone: "serious",
      intent: "addressing_problem",
      personName: "Steve",
      personContext: "A coworker who's been overstepping",
      facts: [
        "Steve keeps taking credit for the player's work",
        "The player needs to address it",
      ],
      initialTranscript: [
        {
          role: "them",
          text: "Hey good job presenting MY idea in the meeting today",
        },
        { role: "them", text: "Real team player move 🙄" },
      ],
      difficultyTags: ["hard"],
    },
  },

  // === HARD: Confusable contexts, high stakes mix ===

  {
    id: "ex-vs-crush",
    difficulty: "hard",
    theme: "narrative",
    situationA: {
      id: "ex-text",
      topic: "relationships",
      tone: "serious",
      intent: "reconnecting",
      personName: "Nathan",
      personContext: "Your ex from 2 years ago",
      facts: [
        "The breakup was mutual",
        "The player and Nathan haven't spoken since",
      ],
      initialTranscript: [
        { role: "them", text: "Hey, I know this is random" },
        { role: "them", text: "But I've been thinking about you lately" },
      ],
      difficultyTags: ["hard"],
    },
    situationB: {
      id: "confession-feelings",
      topic: "relationships",
      tone: "serious",
      intent: "confessing",
      personName: "Jamie",
      personContext: "A close friend",
      facts: [
        "The player and Jamie have been friends for years",
        "The conversation feels different",
      ],
      initialTranscript: [
        { role: "them", text: "Can we talk about something?" },
        { role: "them", text: "I think I might have feelings for you..." },
      ],
      difficultyTags: ["hard"],
    },
  },
  {
    id: "life-changes",
    difficulty: "hard",
    theme: "contrast",
    situationA: {
      id: "layoff-news",
      topic: "career",
      tone: "stressed",
      intent: "venting",
      personName: "Daniel",
      personContext: "Your close friend",
      facts: ["Daniel works in tech", "Daniel's company just did layoffs"],
      initialTranscript: [
        { role: "them", text: "I got laid off today" },
        { role: "them", text: "After 5 years. Just like that." },
      ],
      difficultyTags: ["hard"],
    },
    situationB: {
      id: "promotion-news",
      topic: "career",
      tone: "excited",
      intent: "sharing_news",
      personName: "Hayden",
      personContext: "Coworker who got promoted",
      facts: [
        "Hayden just got promoted to team lead",
        "The player and Hayden work on the same team",
      ],
      initialTranscript: [
        { role: "them", text: "I got the promotion!!!" },
        { role: "them", text: "We should celebrate!" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "family-news",
    difficulty: "hard",
    theme: "confusable",
    situationA: {
      id: "new-baby",
      topic: "family",
      tone: "excited",
      intent: "sharing_news",
      personName: "Marley",
      personContext: "Your cousin who just had a baby",
      facts: ["The baby was born yesterday", "It's a girl"],
      initialTranscript: [
        { role: "them", text: "SHE'S HERE!! 👶" },
        { role: "them", text: "7 pounds, 4 oz of pure perfection" },
      ],
      difficultyTags: ["easy"],
    },
    situationB: {
      id: "friend-pregnancy",
      topic: "family",
      tone: "excited",
      intent: "sharing_news",
      personName: "Lauren",
      personContext: "Your close friend",
      facts: [
        "Lauren has been trying to have a baby for years",
        "Lauren just found out she's pregnant",
      ],
      initialTranscript: [
        {
          role: "them",
          text: "I have to tell someone or I'm going to explode",
        },
        {
          role: "them",
          text: "We're pregnant!!! 😭❤️ After everything we've been through",
        },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "support-circle",
    difficulty: "hard",
    theme: "confusable",
    situationA: {
      id: "breakup-comfort",
      topic: "relationships",
      tone: "concerned",
      intent: "seeking_comfort",
      personName: "Morgan",
      personContext: "Your friend who just went through a breakup",
      facts: [
        "Morgan broke up with Morgan's partner last week",
        "Morgan and Morgan's partner were together for 2 years",
      ],
      initialTranscript: [
        {
          role: "them",
          text: "I keep thinking about what I could have done differently",
        },
        { role: "them", text: "Do you think it was my fault?" },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "divorce-news",
      topic: "family",
      tone: "serious",
      intent: "sharing_news",
      personName: "Uncle Steve",
      personContext: "Your uncle",
      facts: [
        "Uncle Steve has been married 25 years",
        "Uncle Steve is confiding in the player",
      ],
      initialTranscript: [
        {
          role: "them",
          text: "I need to tell you something before you hear it from someone else",
        },
        { role: "them", text: "Your aunt and I are getting divorced" },
      ],
      difficultyTags: ["hard"],
    },
  },
  {
    id: "secret-feelings",
    difficulty: "hard",
    theme: "confusable",
    situationA: {
      id: "coworker-crush",
      topic: "work",
      tone: "playful",
      intent: "gossiping",
      personName: "Denise",
      personContext: "Your work friend",
      facts: [
        "The player and Denise both noticed James has been extra friendly to the player",
        "Denise is teasing the player about it",
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
    situationB: {
      id: "work-crush",
      topic: "dating",
      tone: "playful",
      intent: "testing_waters",
      personName: "Anna",
      personContext: "Coworker you've been flirting with",
      facts: [
        "The player and Anna have been chatting more outside work",
        "There's obvious chemistry",
      ],
      initialTranscript: [
        { role: "them", text: "So that coffee we keep talking about..." },
        { role: "them", text: "Are we ever actually going to do that? 😊" },
      ],
      difficultyTags: ["medium"],
    },
  },
  {
    id: "wedding-chaos",
    difficulty: "hard",
    theme: "confusable",
    situationA: {
      id: "wedding-drama",
      topic: "events",
      tone: "stressed",
      intent: "venting",
      personName: "Emery",
      personContext: "Friend planning their wedding",
      facts: ["The wedding is in 3 months", "Family drama is causing stress"],
      initialTranscript: [
        {
          role: "them",
          text: "My in-laws are being impossible about the seating chart",
        },
        { role: "them", text: "Why is wedding planning so stressful??" },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "wedding-invitation",
      topic: "social",
      tone: "formal",
      intent: "inviting",
      personName: "Jennifer",
      personContext: "Your college friend",
      facts: [
        "Jennifer is getting married next summer",
        "The player is on the guest list",
      ],
      initialTranscript: [
        { role: "them", text: "Save the date!! 💒" },
        { role: "them", text: "June 15th, and you better be there!" },
      ],
      difficultyTags: ["easy"],
    },
  },
  {
    id: "money-awkward",
    difficulty: "hard",
    theme: "confusable",
    situationA: {
      id: "crypto-advice",
      topic: "money",
      tone: "excited",
      intent: "recommending",
      personName: "Kyle",
      personContext: "Your cousin who's really into crypto",
      facts: [
        "Kyle has made some money trading",
        "Kyle wants the player to invest too",
      ],
      initialTranscript: [
        { role: "them", text: "Bro you NEED to get into crypto" },
        {
          role: "them",
          text: "I just 10x'd my investment. I can show you how",
        },
      ],
      difficultyTags: ["medium"],
    },
    situationB: {
      id: "friend-mlm",
      topic: "social",
      tone: "casual",
      intent: "selling",
      personName: "Brittany",
      personContext: "Old friend from high school",
      facts: [
        "The player and Brittany haven't talked in years",
        "Brittany recently started a 'business'",
      ],
      initialTranscript: [
        { role: "them", text: "Hey babe!! It's been SO long!" },
        {
          role: "them",
          text: "I have an amazing opportunity I'd love to share with you 💅✨",
        },
      ],
      difficultyTags: ["hard"],
    },
  },
  {
    id: "elder-care",
    difficulty: "hard",
    theme: "confusable",
    situationA: {
      id: "mom-health",
      topic: "family",
      tone: "concerned",
      intent: "seeking_support",
      personName: "Mom",
      personContext: "Your mother",
      facts: [
        "Mom had a doctor's appointment today",
        "Mom doesn't like to worry the player",
      ],
      initialTranscript: [
        { role: "them", text: "Doctor wants to run some more tests" },
        {
          role: "them",
          text: "I'm sure it's nothing but thought you should know",
        },
      ],
      difficultyTags: ["hard"],
    },
    situationB: {
      id: "dad-retirement",
      topic: "family",
      tone: "excited",
      intent: "sharing_news",
      personName: "Dad",
      personContext: "Your father",
      facts: [
        "Dad has been working for 40 years",
        "Dad finally decided to retire",
      ],
      initialTranscript: [
        { role: "them", text: "Big news!" },
        {
          role: "them",
          text: "I put in my retirement papers today. July 1st is my last day!",
        },
      ],
      difficultyTags: ["easy"],
    },
  },

  // === TRIOS: Extreme mode only ===

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
        "The player is working on the frontend",
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
        "The player and Taylor are both free this weekend",
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
        "The player's favorite band is coming to town",
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
      facts: ["Team is going out tonight", "Lisa wants the player to join"],
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
        "The player is very busy with work",
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
        "The player and Matt both play the same mobile game",
        "Matt just beat the player's high score",
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
      facts: ["The player and Robin had dinner last night", "It went well"],
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
        "The player and Nathan haven't spoken since",
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
        "The player and Denise both noticed James has been extra friendly to the player",
        "Denise is teasing the player about it",
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
        "The player and Alex haven't seen each other in 2 weeks",
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
        "The player and Jordan both go to the same gym",
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
        "The player and Maria haven't seen each other in 10 years",
        "Maria found the player on social media",
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

export default pairs;
