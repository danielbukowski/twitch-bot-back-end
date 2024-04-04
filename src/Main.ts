import ObjectManager from "./ObjectManager";
import ConfigInitializer from "./ConfigInitializer";

const configInitializer = new ConfigInitializer();
const objectManager = new ObjectManager(configInitializer);

(async () => {
  try {
    configInitializer.checkConfigurationVariables();
    await objectManager.initializeClasses();
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log(
        `An error occurred when running the application, reason: ${e.message}`,
      );
      console.log(e.stack);
    }
    process.exit(1);
  }
})();
