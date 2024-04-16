import ConfigInitializer from "./ConfigInitializer";
import ObjectManager from "./ObjectManager";

const configInitializer = new ConfigInitializer();
const objectManager = new ObjectManager(configInitializer);

(async () => {
	try {
		configInitializer.checkConfigurationVariables();
		await objectManager.initializeClasses();
	} catch (e: unknown) {
		if (e instanceof Error) {
			console.log(
				`\x1b[31mAn error occurred when running the application, reason: ${e.message}\x1b[0m`,
			);
			console.log(e.stack);
		}
		process.exit(1);
	}
})();
