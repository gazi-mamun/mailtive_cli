import * as fs from "fs";

import { validate } from "deep-email-validator";
import chalk from "chalk";
import { createSpinner } from "nanospinner";
import cliProgress from "cli-progress";

const makeEmails = (filepath, filename) => {
  const spinner = createSpinner();
  console.log("\n");
  spinner.start({ text: " Extracting emails", color: "cyan" });

  try {
    // E:/Node project/verimail/api/emails/emails_5.txt

    const dividedPath = filepath.split("/");
    const dividedName = dividedPath[dividedPath.length - 1].split(".");
    const fileExtension = dividedName[dividedName.length - 1];

    if (fileExtension !== "txt") {
      return spinner.stop({
        text: chalk.red("Please select a text file!"),
        mark: chalk.red("🧨"),
      });
    }

    const emails = fs
      .readFileSync(filepath)
      .toString()
      .replace(/\r\n/g, "\n")
      .split("\n");

    spinner.success({
      text: chalk.cyan(" Extraction of emails completed"),
      mark: chalk.cyan("✔"),
    });
    console.log("\n");

    if (emails.length <= 0) {
      return;
    }

    validateEmails(emails).then((aEmails) => makeTextFile(aEmails, filename));
  } catch (err) {
    if (err.code === "ENOENT") {
      spinner.stop({
        text: chalk.red("File not found!"),
        mark: chalk.red("🧨"),
      });
    } else {
      throw err;
    }
  }
};

const validateSingleEmail = async (mail, showReason) => {
  const spinner = createSpinner();
  console.log("\n");
  spinner.start({ text: chalk.cyan(" Checking the email \n"), color: "cyan" });

  const res = await validate(mail);

  // valid
  if (res.valid) {
    spinner.success({
      text: chalk.green(
        " " +
          chalk.cyan(`${mail}`) +
          ` is an valid and active email address. \n`
      ),
      mark: chalk.green("✔ ✉"),
    });
  }
  // not valid
  else {
    if (!showReason) {
      // without reason
      spinner.success({
        text: chalk.red(
          " " + chalk.cyan(`${mail}`) + ` is a fake email address. \n`
        ),
        mark: chalk.red("❌ 🧧"),
      });
    } else {
      // with reason
      spinner.success({
        text: chalk.red(
          ` ` + chalk.cyan(`${mail}`) + ` is a fake email address. \n`
        ),
        mark: chalk.red("❌ 🧧"),
      });

      const cause = res.reason;
      Object.keys(res.validators).forEach((key) => {
        if (key == cause) {
          const reason = res.validators[key].reason;
          console.log(
            chalk.yellow(
              chalk.inverse(chalk.bold(`Reason:`)) + ` ` + reason + `\n`
            )
          );
        }
      });
    }
  }
};

const validateEmails = async (mails) => {
  console.log(chalk.cyan(` * Filtering active emails: \n`));

  const totalMails = mails.length;
  let checked = 0;

  // create a new progress bar instance and use shades_classic theme
  const bar1 = new cliProgress.SingleBar(
    {
      format:
        chalk.cyan(" {bar}") +
        chalk.cyan(
          " {percentage}% | {value}/{total} | ETA: {eta_formatted} | ET: {duration_formatted}"
        ),
    },
    cliProgress.Presets.shades_classic
  );

  // start the progress bar with a total value of 200 and start value of 0
  bar1.start(totalMails, checked);

  const activeMails = [];

  for (let mail of mails) {
    const res = await validate(mail);

    checked++;
    // update the current value in your application..
    bar1.update(checked);

    if (res.valid) {
      activeMails.push(mail);
    }
  }

  // stop the progress bar
  bar1.stop();
  return activeMails;
};

const fileRenaming = (name, count = 0) => {
  let finalName = name;
  if (fs.existsSync(`${name}.txt`)) {
    const newName = `${name.split(` (${count})`)[0]} (${count + 1})`;
    finalName = fileRenaming(newName, count + 1);
  }
  return finalName;
};

const makeTextFile = (arr, filename) => {
  console.log("\n");
  const spinner = createSpinner();
  spinner.start({
    text: " Creating a new file for active emails.",
    color: "cyan",
  });

  const checkedFilename = fileRenaming(filename);

  let file = fs.createWriteStream(`${checkedFilename}.txt`);
  file.on("error", function (err) {
    spinner.stop({
      text: chalk.red("Something went wrong when creating the file!"),
      mark: chalk.red("🧨"),
    });
  });
  arr.forEach(function (v) {
    file.write(v + "\n");
  });
  file.end();

  spinner.success({
    text: chalk.cyan(
      ` Active emails are listed in the file ${checkedFilename}.txt`
    ),
    mark: chalk.cyan("✔"),
  });
};

export { makeEmails, validateEmails, validateSingleEmail, makeTextFile };
