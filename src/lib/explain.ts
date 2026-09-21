import type { FileInfo, GraphNode } from '../types'
import { isTestFile } from './analyze'

export interface Explanation {
  what: string
  why: string
  watch: string
}

const EXT_DESC: Record<string, { what: string; watch: string }> = {
  js: { what: 'JavaScript code that adds behavior to the application.', watch: 'Functions, exports, and how other files import them.' },
  jsx: { what: 'A React component written in JavaScript with interface markup.', watch: 'The component name, its props, and what it renders.' },
  ts: { what: 'TypeScript code with explicit types on top of JavaScript.', watch: 'The exported types and functions, and what imports them.' },
  tsx: { what: 'A React component written in TypeScript.', watch: 'The props interface and what the component renders.' },
  py: { what: 'Python code that defines functions, classes, or scripts.', watch: 'Imports at the top of the file and the public functions below.' },
  html: { what: 'An HTML page that defines page structure and loads scripts and styles.', watch: 'Script and link tags that pull in the application.' },
  css: { what: 'A stylesheet that controls colors, layout, and typography.', watch: 'Selectors and the classes they style.' },
  scss: { what: 'An SCSS stylesheet with variables and nesting that compiles to CSS.', watch: 'Imports and shared variables.' },
  json: { what: 'A JSON file holding structured data or configuration.', watch: 'The keys and values, and which code reads them.' },
  md: { what: 'A Markdown document with written documentation.', watch: 'Headings and code examples.' },
  yml: { what: 'A YAML file, usually configuration for a tool or service.', watch: 'The sections and the values they set.' },
  yaml: { what: 'A YAML file, usually configuration for a tool or service.', watch: 'The sections and the values they set.' },
  sql: { what: 'SQL statements that define or query database tables.', watch: 'Table names and columns.' },
  sh: { what: 'A shell script that automates commands.', watch: 'The commands it runs and in what order.' },
  go: { what: 'Go source code, usually one package per folder.', watch: 'The package name, exported functions, and main entry.' },
  rs: { what: 'Rust source code with strict ownership rules.', watch: 'Structs, impls, and the public API of the module.' },
  java: { what: 'A Java class definition.', watch: 'The class name, methods, and imports.' },
  rb: { what: 'Ruby code, often a class or script.', watch: 'Class definitions and method names.' },
  php: { what: 'PHP code, often a page or class.', watch: 'Included files and functions.' },
  ipynb: { what: 'A Jupyter notebook mixing code cells with explanations.', watch: 'The order of cells and what each computes.' },
  vue: { what: 'A Vue single file component with template, script, and styles.', watch: 'The template section and the component script.' },
  svelte: { what: 'A Svelte component file.', watch: 'Reactive statements and the markup.' },
}

export function explainFile(f: FileInfo, context?: { folderPurpose?: string }): Explanation {
  const desc = EXT_DESC[f.ext]
  const test = isTestFile(f)
  if (test) {
    return {
      what: `An automated test for ${f.name.replace(/\.(test|spec)\.[^.]+$/, '')}. It runs code and checks that results match expectations.`,
      why: 'Tests document intended behavior and protect the project from silent breakage.',
      watch: 'The test names and the assertions inside them.',
    }
  }
  if (f.name.toLowerCase() === 'readme.md' || f.name.toLowerCase() === 'readme') {
    return {
      what: 'The main documentation file. It explains what the project does and how to set it up.',
      why: 'It is the intended first stop for anyone new to the repository.',
      watch: 'Setup instructions and links to further documentation.',
    }
  }
  if (f.name === 'package.json') {
    return {
      what: 'The Node.js manifest. It declares the project name, scripts, and dependencies.',
      why: 'It tells you every library the project relies on and the commands available to run it.',
      watch: 'The scripts, dependencies, and devDependencies sections.',
    }
  }
  if (desc) {
    return {
      what: desc.what + (context?.folderPurpose ? ` It lives in a folder that ${context.folderPurpose.toLowerCase().replace(/\.$/, '')}.` : ''),
      why: 'Understanding this file clarifies one concrete responsibility of the project.',
      watch: desc.watch,
    }
  }
  return {
    what: `A project file (${f.name}) inside ${f.dir || 'the repository root'}.`,
    why: 'It contributes to one part of the project behavior or configuration.',
    watch: 'Its contents and which other files reference it.',
  }
}

export function explainNode(n: GraphNode): Explanation {
  if (n.kind === 'folder' && n.group === 'tests') {
    return { what: n.purpose, why: n.why, watch: 'How tests are organized and how to run them.' }
  }
  if (n.kind === 'actor') {
    return { what: 'The browser is the runtime environment for the user facing part of this project.', why: 'It defines what technologies can be used on the front end.', watch: 'How pages are loaded and what scripts they request.' }
  }
  if (n.kind === 'dependency') {
    return { what: `${n.label} is an external package declared in the project manifest.`, why: 'The project delegates part of its functionality to this library instead of writing it from scratch.', watch: 'Where the package is imported and which features of it are used.' }
  }
  return { what: n.purpose, why: n.why, watch: 'How it connects to the neighboring nodes on the map.' }
}
