import { exec } from "child_process";

function setupAndRunPythonScript() {
  console.log("Creating and activating virtual environment...");

  const createVirtualEnvCommand = "python -m venv ./src/scripts/venv";
  const activateVirtualEnvCommand = "src\\scripts\\venv\\Scripts\\activate";
  const installPackagesCommand = "pip install -r requirements.txt";
  const runScriptCommand = "python scrape_neetcode.py";

  const options = {
    cwd: "./src/scripts/",
  };

  exec(createVirtualEnvCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating virtual environment: ${error}`);
      return;
    }
    console.log(`Virtual environment created: ${stdout}`);
    if (stderr) {
      console.error(`Creation error: ${stderr}`);
    }

    exec(
      activateVirtualEnvCommand,
      (activateError, activateStdout, activateStderr) => {
        if (activateError) {
          console.error(
            `Error activating virtual environment: ${activateError}`
          );
          return;
        }
        console.log(`Virtual environment activated: ${activateStdout}`);
        if (activateStderr) {
          console.error(`Activation error: ${activateStderr}`);
        }

        exec(
          installPackagesCommand,
          options,
          (installError, installStdout, installStderr) => {
            if (installError) {
              console.error(
                `Error installing Python packages: ${installError}`
              );
              return;
            }
            console.log(`Python packages installed: ${installStdout}`);
            if (installStderr) {
              console.error(`Installation error: ${installStderr}`);
            }

            exec(
              runScriptCommand,
              options,
              (runError, runStdout, runStderr) => {
                if (runError) {
                  console.error(`Error running Python script: ${runError}`);
                  return;
                }
                console.log(`Python script output: ${runStdout}`);
                if (runStderr) {
                  console.error(`Script error: ${runStderr}`);
                }
              }
            );
          }
        );
      }
    );
  });
}

setupAndRunPythonScript();
