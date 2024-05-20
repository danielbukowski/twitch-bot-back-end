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
			Logger.fatal(
				`An error occurred when running the application, reason: ${e.message}`,
			);
		}
		process.exit(1);
	}
})();
