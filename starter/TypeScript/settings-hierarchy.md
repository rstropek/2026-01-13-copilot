We have metadata about settings.

Each setting has:

* namespace (hierarchical, e.g. `motor/front/pressure`)
* identifier (globally unique)
* description
* nullable? (bool)
* data types: string, number, bool
* default value (data type dependent)
* optional uom (unit of measure, only for number data type)
* min/max values (optional, only for number data type, inclusive)

We implement the metadata types as TypeScript `type`s, not `interfaces`.
