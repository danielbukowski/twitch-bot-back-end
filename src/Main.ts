import ConfigInitializer from "./ConfigInitializer";
import Logger from "./Logger";
import ObjectManager from "./ObjectManager";

const configInitializer = new ConfigInitializer();
const objectManager = new ObjectManager(configInitializer);

(async () => {
	try {
		configInitializer.checkEnvironmentVariables();
		await objectManager.initializeClasses();
	} catch (e: unknown) {
		if (e instanceof Error) {
			Logger.fatal("The application has stopped working,", e);
		}
		process.exit(1);
	}
})();
