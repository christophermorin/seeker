import fs from 'fs/promises';
import path from 'path';

const rootDir = path.join(process.cwd(), '/');
const allowTheseExtensions = [".js", ".ts", ".jsx", ".tsx", ".html"]
const disallowedDirs = ["node_modules", "dist", "build"]

async function processFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const lines = data.split('\n');
    let hasTodo = false;
    const file = filePath.split(path.sep);
    const fileName = file.slice(1).join("/")

    let fileContent = '';

    lines.forEach((line, linenumber) => {
      if (line.startsWith("// TODO")) {
        if (!hasTodo) {
          hasTodo = true
          fileContent += `## FILE: ${fileName}\n\n`
        }
        fileContent += `- Line ${linenumber + 1}: ${line.trim()}\n`
      }
    })

    if (hasTodo) {
      fileContent += `\n`
    }
    return fileContent;
  } catch (err) {
    console.log(`Error parsing file: ${fileName}`)
    throw err;
  }
}

async function writeMarkdownFile(markdownContent) {
  try {
    await fs.writeFile('TODO.md', markdownContent);
  } catch (err) {
    throw err;
  }
}


async function generateMarkDownOfToDos(directory) {
  try {
    const files = await fs.readdir(directory)

    let markdownContent = '';

    for (const file of files) {
      if (disallowedDirs.includes(file)) {
        break
      }
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      if (
        stats.isDirectory()) {
        const subDirectoryContent = await generateMarkDownOfToDos(filePath);
        markdownContent += subDirectoryContent;
      } else if (
        stats.isFile() &&
        allowTheseExtensions.includes(path.extname(file))
      ) {
        const fileContent = await processFile(filePath);
        markdownContent += fileContent;
      }
    }
    return markdownContent;
  } catch (error) {
    console.log("Error generating markdown", error)
    throw new Error
  }
}

generateMarkDownOfToDos(rootDir)
  .then((markdownContent) => {
    if (!markdownContent) {
      console.log("🐟🐟🐟 --- No rogue TODOs found. \n Time to create a new feature...")
      return
    } else {
      writeMarkdownFile(markdownContent)
        .then(() => console.log('### Markdown file created successfully'))
    }
  })
  .catch((err) => console.error('Error:', err));
