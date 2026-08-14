// Relation naming rules for the relations generator (issues #98/#103).
//
// Agreed rules (map ticket #94, decision in #98):
//   one()   = singularized TS export name of the referenced table
//             (`expenses.category`, `auditLog.user`). When the referencing
//             table has multiple FKs to the same target, prefix with the FK
//             column stem: `transfer.fromAccount`, `transfer.toAccount`,
//             `transfer.feeAccount` (matches the Fee Attribution vocabulary).
//   many()  = pluralized TS export name of the referencing table
//             (`user.accounts`, `accounts.expenses`), stem-prefixed on the
//             same ambiguity: `accounts.fromTransfers`, `accounts.feeTransfers`.
//
// Inflection is naive (zero dependencies) plus a documented exceptions map
// for irregular/mass nouns. `income` → `incomes` is deliberately accepted to
// keep the rule mechanical.

// Mass/irregular nouns whose plural does not take a bare -s. Keys and values
// are TS export names. Extend here — never inline — when a new table lands.
export const PLURAL_EXCEPTIONS: Record<string, string> = {
	staff: "staff",
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function singularize(name: string): string {
	if (name.endsWith("ies")) return `${name.slice(0, -3)}y`;
	if (name.endsWith("s") && !name.endsWith("ss")) return name.slice(0, -1);
	return name;
}

export function pluralize(name: string): string {
	if (name in PLURAL_EXCEPTIONS) return PLURAL_EXCEPTIONS[name] as string;
	if (name.endsWith("s")) return name; // already plural (expenses, settings)
	return `${name}s`;
}

// Strips the FK stem from a referencing column property: `fromAccountId` →
// `from`, `accountId` → ``, `changedBy` → `changedBy` (fallback: no Id
// suffix and no embedded target name — used verbatim on ambiguity).
export function fkStem(fromProp: string, targetTsName: string): string {
	const base = singularize(targetTsName);
	let stem = fromProp.endsWith("Id") ? fromProp.slice(0, -2) : fromProp;
	if (
		stem.length > base.length &&
		stem.toLowerCase().endsWith(base.toLowerCase())
	) {
		stem = stem.slice(0, stem.length - base.length);
	}
	return stem;
}

export function oneName(
	fromProp: string,
	targetTsName: string,
	ambiguous: boolean,
): string {
	const base = singularize(targetTsName);
	if (!ambiguous) return base;
	const stem = fkStem(fromProp, targetTsName);
	return stem ? `${stem}${capitalize(base)}` : base;
}

export function manyName(
	sourceTsName: string,
	_targetTsName: string,
	ambiguous: boolean,
	stem?: string,
): string {
	const base = pluralize(sourceTsName);
	if (!ambiguous) return base;
	return stem ? `${stem}${capitalize(base)}` : base;
}

// Stable pairing key for ambiguous (multi-FK) relation groups. Both the
// one() and many() sides must pass the identical string. Format matches the
// previous hand-written relations file: `<table>_<fromProp>_<target>_<toProp>`.
export function aliasString(
	sourceTsName: string,
	fromProp: string,
	targetTsName: string,
	toProp: string,
): string {
	return `${sourceTsName}_${fromProp}_${targetTsName}_${toProp}`;
}
