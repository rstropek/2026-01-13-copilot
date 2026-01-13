We want to add automatic conversion of UOMs (units of measure) for settings of type `number` in [configurable.md](./packages/shared/src/providers/configurable.ts).

* Create a help method (protected in `ConfigurableMachine`) that converts a value from one UOM to another.
* Add UOM conversion logic for the UOMs defined in the enum `UnitOfMeasure`. The method should return `null` if conversion is not possible.
* Automatically apply UOM conversion when validating setting values using `verifySettings`. Perform min/max checks after conversion.

