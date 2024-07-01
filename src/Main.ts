import ConfigInitializer from "./ConfigInitializer";
import * as Logger from "./Logger";
import ObjectManager from "./ObjectManager";

const configInitializer = new ConfigInitializer();
const objectManager = new ObjectManager(configInitializer);

(async () => {
	try {
		configInitializer.checkEnvironmentVariables();
		await objectManager.initializeClasses();
	} catch (e: unknown) {
		Logger.fatal("The application failed to initialize!");
		process.exit(1);
	}
})();
