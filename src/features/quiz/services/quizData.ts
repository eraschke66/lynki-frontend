import type { Quiz } from "@/types/quiz";

/**
 * Mock quiz data for development.
 * In production, this would be fetched from an API.
 */
export const dummyQuizzes: Quiz[] = [
  {
    id: "1",
    title: "JavaScript Fundamentals",
    description: "Test your knowledge of JavaScript basics",
    generationStatus: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: "q1",
        question:
          "What is the correct way to declare a variable in JavaScript?",
        options: [
          "variable myVar",
          "let myVar",
          "var: myVar",
          "myVar := value",
        ],
        correctAnswer: 1,
        explanation:
          "In modern JavaScript, 'let' is the correct way to declare a variable. It provides block-scoping and prevents common errors associated with 'var'.",
        hint: "Think about block scoping.",
      },
      {
        id: "q2",
        question:
          "Which method is used to add an element to the end of an array?",
        options: ["push()", "add()", "append()", "insert()"],
        correctAnswer: 0,
        explanation:
          "The push() method adds one or more elements to the end of an array and returns the new length of the array.",
        hint: "It puts it at the end, like pushing something onto a stack.",
      },
      {
        id: "q3",
        question: "What does 'NaN' stand for in JavaScript?",
        options: [
          "Null and Nothing",
          "Not a Number",
          "No Available Name",
          "Negative and Null",
        ],
        correctAnswer: 1,
        explanation:
          "NaN stands for 'Not a Number' and is a special value that represents an invalid or undefined numerical result.",
        hint: "It happens when you try to do math with a string.",
      },
      {
        id: "q4",
        question: "Which operator is used for strict equality in JavaScript?",
        options: ["==", "===", "=", "equals()"],
        correctAnswer: 1,
        explanation:
          "The === operator checks for strict equality, comparing both value and type. It's generally preferred over == which performs type coercion.",
        hint: "It has three equals signs.",
      },
      {
        id: "q5",
        question: "What is the output of: typeof []?",
        options: ["array", "object", "list", "undefined"],
        correctAnswer: 1,
        explanation:
          "In JavaScript, arrays are actually objects. The typeof operator returns 'object' for arrays. To check if something is an array, use Array.isArray().",
        hint: "Arrays are a special type of this basic data structure.",
      },
    ],
  },
  {
    id: "2",
    title: "React Basics",
    description: "Fundamentals of React framework",
    generationStatus: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: "q1",
        question: "What is a React Hook?",
        options: [
          "A way to catch errors",
          "A function that lets you use state and lifecycle features",
          "A component lifecycle method",
          "A third-party library",
        ],
        correctAnswer: 1,
        explanation:
          "Hooks are functions that let you use state and other React features in functional components. They were introduced in React 16.8.",
        hint: "It allows function components to have state.",
      },
      {
        id: "q2",
        question: "Which hook is used for side effects in React?",
        options: ["useState", "useEffect", "useContext", "useReducer"],
        correctAnswer: 1,
        explanation:
          "useEffect is the hook for performing side effects in functional components, such as data fetching, subscriptions, or manually changing the DOM.",
        hint: "Effect as in side-effect.",
      },
      {
        id: "q3",
        question: "What does JSX stand for?",
        options: [
          "JavaScript XML",
          "Java Syntax Extension",
          "JavaScript Extension",
          "Java XML",
        ],
        correctAnswer: 0,
        explanation:
          "JSX stands for JavaScript XML. It's a syntax extension for JavaScript that allows you to write HTML-like code within JavaScript.",
        hint: "It looks like XML in JavaScript.",
      },
    ],
  },
  {
    id: "3",
    title: "Web Development Trivia",
    description: "General web development knowledge",
    generationStatus: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: "q1",
        question: "What does CSS stand for?",
        options: [
          "Computer Style Sheets",
          "Cascading Style Sheets",
          "Creative Style Sheets",
          "Colorful Style Sheets",
        ],
        correctAnswer: 1,
        explanation:
          "CSS stands for Cascading Style Sheets. It's used to describe the presentation of a document written in HTML or XML.",
        hint: "It cascades down from parent to child.",
      },
      {
        id: "q2",
        question: "Which HTTP method is used to retrieve data?",
        options: ["POST", "PUT", "GET", "DELETE"],
        correctAnswer: 2,
        explanation:
          "GET is the HTTP method used to retrieve data from a server. It should only retrieve data and should not have any side effects.",
        hint: "You 'get' something.",
      },
      {
        id: "q3",
        question: "What is the default port for HTTP?",
        options: ["443", "8080", "3000", "80"],
        correctAnswer: 3,
        explanation:
          "Port 80 is the default port for HTTP connections. Port 443 is for HTTPS, while 8080 and 3000 are commonly used for development servers.",
        hint: "It's a two digit number.",
      },
      {
        id: "q4",
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Tech Modern Language",
          "Home Tool Markup Language",
          "Hyperlinks and Text Markup Language",
        ],
        correctAnswer: 0,
        explanation:
          "HTML stands for Hyper Text Markup Language. It's the standard markup language for creating web pages and web applications.",
        hint: "Hyper Text...",
      },
    ],
  },
];
