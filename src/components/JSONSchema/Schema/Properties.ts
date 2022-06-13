import { RootSchema } from './Root'
import { IDiagnostic, Schema } from './Schema'
import { InterfaceType } from '../ToTypes/Interface'

export class PropertiesSchema extends Schema {
	protected children: Record<string, Schema> = {}

	get types() {
		return [<const>'object']
	}

	constructor(location: string, key: string, value: unknown) {
		super(location, key, value)

		if (typeof value !== 'object' && typeof value !== 'undefined')
			throw new Error(
				`Invalid usage of "properties" schema field. Expected type "object", received "${typeof value}"`
			)

		this.children = Object.fromEntries(
			Object.entries(value ?? {}).map(([key, val]) => [
				key,
				new RootSchema(this.location, key, val),
			])
		)
	}

	getSchemasFor(obj: unknown, location: (string | number)[]) {
		const key = location.shift()

		if (key === undefined) return Object.values(this.children)
		else if (location.length === 0)
			return this.children[key] ? [this.children[key]] : []
		return (
			this.children[key]?.getSchemasFor((<any>obj)[key], [...location]) ??
			[]
		)
	}

	getCompletionItems(context: unknown) {
		const propertyContext = Object.keys(
			typeof context === 'object' ? context ?? {} : {}
		)

		return Object.keys(<object>this.value)
			.filter((property) => !propertyContext.includes(property))
			.map(
				(value) =>
					<const>{
						type: 'object',
						label: `${value}`,
						value,
					}
			)
	}

	validate(obj: unknown) {
		if (typeof obj !== 'object' || Array.isArray(obj))
			return [
				{
					message: `Invalid type: Expected "object", received "${
						Array.isArray(obj) ? 'array' : typeof obj
					}"`,
				},
			]

		const diagnostics: IDiagnostic[] = []

		for (const key in obj) {
			if (this.children[key])
				diagnostics.push(
					...this.children[key].validate((<any>obj)[key])
				)
		}

		return diagnostics
	}

	override toTypeDefinition(hoisted: Set<Schema>) {
		const interfaceType = new InterfaceType()

		for (const [propertyName, child] of Object.entries(this.children)) {
			const type = child.toTypeDefinition(hoisted)
			if (type === null) continue

			interfaceType.addProperty(propertyName, type)
		}

		return interfaceType
	}
}
