import {
	boolean,
	check,
	date,
	foreignKey,
	index,
	numeric,
	text,
	varchar,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { baseDrizzleSchema, inList, mySchema } from "./base";

// Enum definition
export const employmentTypeEnum = [
	"daily_wage",
	"monthly",
	"part_time",
	"contractor",
] as const;

export type employmentType = (typeof employmentTypeEnum)[number];

export const staff = mySchema.table(
	"staff",
	{
		...baseDrizzleSchema,
		organizationId: text("organization_id").notNull(),
		name: varchar("name", { length: 200 }).notNull(),
		phone: varchar("phone", { length: 20 }),
		role: varchar("role", { length: 100 }),
		employmentType: text("employment_type").$type<employmentType>(),
		dailyRate: numeric("daily_rate", { precision: 12, scale: 2 }),
		monthlyRate: numeric("monthly_rate", { precision: 12, scale: 2 }),
		joinDate: date("join_date"),
		leaveDate: date("leave_date"),
		isActive: boolean("is_active").default(true),
		notes: text("notes"),
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "staff_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		check(
			"employment_type_check",
			inList("employment_type", employmentTypeEnum),
		),
		index("staff_name_idx").on(t.organizationId, t.name),
		index("staff_is_active_idx").on(t.organizationId, t.isActive),
		index("staff_deleted_at_idx").on(t.organizationId, t.deletedAt),
		index("staff_created_at_idx").on(t.organizationId, t.createdAt),
		index("staff_employment_type_idx").on(t.organizationId, t.employmentType),
		index("staff_active_deleted_idx").on(
			t.organizationId,
			t.isActive,
			t.deletedAt,
		),
	],
);
