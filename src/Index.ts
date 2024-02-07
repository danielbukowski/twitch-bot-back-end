import ObjectManager from "./ObjectManager";
import ConfigInitializer from "./ConfigInitializer";

const configInitializer = new ConfigInitializer();
const objectManager = new ObjectManager(configInitializer);



try {
	configInitializer.checkConfigurationVariables();
	objectManager.initManageableClasses();
} catch (e: unknown) {
	console.log(`An error occurred when running the application, reason: ${e instanceof Error ? e.message : "Unknown"}`);
}
