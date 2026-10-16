# Levli App — Data Schema

Complete field reference for every entity in the app.

## Built-in attributes

Every record in every entity carries these four attributes automatically. They are never declared in a schema and are always present on a saved record.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique record id. |
| `created_date` | string (ISO timestamp) | Set when the record is created. |
| `updated_date` | string (ISO timestamp) | Set on every save. |
| `created_by_id` | string | **Reference → `User`.** The account that owns the record. |

## Access rules (RLS)

| Entity | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| AdverseEvent | own records | own records | own records | own records |
| DayMetric | own records | own records | own records | own records |
| Inventory | own records | own records | own records | own records |
| JournalEntry | own records | own records | own records | own records |
| Medication | own records | own records | own records | own records |
| ProgressPhoto | own records | own records | own records | own records |
| ProxyAccess | own records | own records | own records | own records |
| PushOutbox | no access | no access | no access | no access |
| RepeatSchedule | own records | own records | own records | own records |
| Shot | own records | own records | own records | own records |
| StorageLog | own records | own records | own records | own records |
| User | platform-managed | platform-managed | admin only | admin only |
| UserProfile | own records | own records | own records | own records |
| UserSubscription | no access | own records (`user_id` = caller) | no access | no access |

"Own records" means the rule matches `created_by_id` against the signed-in user's id.

---

## AdverseEvent

A symptom or side effect a person logged, optionally linked to the journal entry it came from.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `medication_name` | string | – | – | Medication (by **name**, not a link) |
| `symptom` | string | Yes | – | – |
| `symptom_key` | string | – | – | – |
| `symptom_category` | string | – | – | – |
| `severity` | string (enum: `mild`, `moderate`, `severe`, `emergency`) | – | – | – |
| `onset_date` | string (date) | Yes | – | – |
| `onset_time` | string | – | – | – |
| `duration` | string | – | – | – |
| `resolution_date` | string (date) | – | – | – |
| `resolved` | boolean | – | `false` | – |
| `relationship_to_dose` | string | – | – | – |
| `user_attribution` | boolean | – | – | – |
| `red_flag_tier` | string (enum: `none`, `emergency`, `urgent`, `routine`) | – | – | – |
| `actions_taken` | string | – | – | – |
| `healthcare_contact` | boolean | – | – | – |
| `outcome` | string | – | – | – |
| `reportability_status` | string | – | – | – |
| `journal_entry_id` | string | – | – | **JournalEntry** |
| `notes` | string | – | – | – |
| `day_key` | string | – | – | – |

## DayMetric

One row per calendar day: weight, nutrition, exercise and that day's progress photo.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `day_key` | string | Yes | – | – |
| `weight` | number | – | – | – |
| `weight_unit` | string | – | – | – |
| `weight_source_unit` | string | – | – | – |
| `weight_unit_check` | string | – | – | – |
| `weight_revert_value` | number | – | – | – |
| `weight_revert_unit` | string | – | – | – |
| `calories` | number | – | – | – |
| `protein` | number | – | – | – |
| `water` | number | – | – | – |
| `fiber` | number | – | – | – |
| `carbs` | number | – | – | – |
| `exercise_min` | number | – | – | – |
| `progress_photo` | string | – | – | Uploaded photo URL (not a ProgressPhoto link) |
| `side_effects` | string | – | – | – |

## Inventory

A tracked product, its lot, expiry and remaining quantity.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `product_name` | string | Yes | – | – |
| `medication_id` | string | – | – | **Medication** |
| `lot_number` | string | – | – | – |
| `expiry_date` | string (date) | – | – | – |
| `starting_quantity` | number | – | – | – |
| `remaining_quantity` | number | – | – | – |
| `quantity_unit` | string | – | `"doses"` | – |
| `storage_location` | string | – | – | – |
| `opened_date` | string (date) | – | – | – |
| `in_use_expiry` | string (date) | – | – | – |
| `expiry_warning_days` | number | – | `14` | – |
| `status` | string (enum: `active`, `depleted`, `expired`, `archived`) | – | `"active"` | – |

## JournalEntry

A free-text journal entry with mood and category.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `text` | string | Yes | – | – |
| `date` | string | Yes | – | – |
| `time` | string | – | – | – |
| `mood` | string | – | – | – |
| `mood_color` | string | – | – | – |
| `category` | string | – | – | – |

## Medication

A medication regimen: the drug, its schedule, prescriber details and status.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `medication_name` | string | Yes | – | – |
| `catalogue_id` | string | – | – | Static catalogue entry id in app code (not an entity) |
| `generic_name` | string | – | – | – |
| `molecular_class` | string | – | – | – |
| `route` | string | – | – | – |
| `prescribed_dose` | number | – | – | – |
| `dose_unit` | string | – | `"mg"` | – |
| `frequency` | string | – | – | – |
| `schedule_kind` | string (enum: `daily`, `weekly`, `twice_weekly`, `every_x_days`, `as_directed`) | – | – | – |
| `reminder_days` | array\<number\> | – | – | – |
| `reminder_time` | string | – | – | – |
| `interval_days` | number | – | – | – |
| `custom_interval_days` | number | – | – | – |
| `indication` | string | – | – | – |
| `start_date` | string (date) | – | – | – |
| `planned_end_date` | string (date) | – | – | – |
| `titration_stage` | string | – | – | – |
| `prescriber_name` | string | – | – | – |
| `prescriber_contact` | string | – | – | – |
| `regimen_source` | string | – | `"user-entered"` | – |
| `needs_details` | boolean | – | `false` | – |
| `status` | string (enum: `active`, `paused`, `discontinued`, `switched`, `archived`) | – | `"active"` | – |
| `discontinued_date` | string (date) | – | – | – |
| `archived_date` | string (date) | – | – | – |
| `custom_doses` | array\<number\> | – | – | – |
| `shots_linked_count` | number | – | – | – |
| `notes` | string | – | – | – |
| `track_supply` | boolean | – | `false` | – |
| `doses_left` | number | – | – | – |
| `supply_unit` | string | – | `"doses"` | – |
| `supply_expiry_date` | string (date) | – | – | – |
| `lot_number` | string | – | – | – |
| `supply_alert_dismissed` | string | – | – | – |

A regimen counts its own supply only once `track_supply` is on; until then `doses_left`, `supply_unit`, `supply_expiry_date` and the dismissed-alert signature are not used. An `archived` regimen is hidden from the dose pickers but its logged doses stay in history and reports.

## ProgressPhoto

A progress photo stored against a day.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `day_key` | string | Yes | – | – |
| `url` | string | Yes | – | – |

## ProxyAccess

Scoped, revocable access granted to a caregiver or proxy.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `grantee_email` | string | Yes | – | – |
| `grantee_user_id` | string | – | – | **User** (filled in on first access) |
| `scope` | string (enum: `read`, `read_write`) | Yes | – | – |
| `status` | string (enum: `pending`, `active`, `revoked`, `expired`) | – | `"pending"` | – |
| `owner_name` | string | – | – | The account holder's name when the invite was saved |
| `relationship` | string | – | – | – |
| `invited_date` | string | – | – | – |
| `expires_at` | string | – | – | Seven days after the invite was sent |
| `granted_date` | string | – | – | – |
| `revoked_date` | string | – | – | – |

Only an `active` grant gives access: it becomes active the first time the invited address signs in, and a `pending` invite that reaches `expires_at` can no longer be accepted.

## PushOutbox

The server-side push queue. Not readable or writable by app users; only backend functions touch it.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `recipient_user_id` | string | Yes | – | **User** |
| `category` | string (enum: `social`, `monetisation`, `retention`) | Yes | – | – |
| `trigger_id` | string | Yes | – | – |
| `title` | string | Yes | – | – |
| `body` | string | Yes | – | – |
| `deep_link` | string | – | – | – |
| `payload` | object | – | – | – |
| `dedupe_key` | string | – | – | – |
| `enqueued_by` | string | – | – | – |
| `status` | string (enum: `pending`, `claimed`, `sent`, `failed`, `dead`) | Yes | `"pending"` | – |
| `claim_token` | string | – | – | – |
| `attempts` | integer | – | `0` | – |
| `last_error` | string | – | – | – |
| `next_attempt_at` | integer (unix seconds) | Yes | – | – |
| `sent_at` | integer (unix seconds) | – | – | – |

## RepeatSchedule

A repeating dose: a fixed number of weeks, or open-ended until changed.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `medication` | string | Yes | – | Medication (by **name**) |
| `medication_id` | string | – | – | **Medication** |
| `dose` | number | Yes | – | – |
| `dose_unit` | string | – | `"mg"` | – |
| `concentration` | string | – | – | – |
| `drug_class` | string | – | – | – |
| `molecular_class` | string | – | – | – |
| `route` | string | – | – | – |
| `device_type` | string | – | – | – |
| `site` | string | – | – | – |
| `notes` | string | – | – | – |
| `time` | string | – | – | – |
| `start_date` | string (date) | Yes | – | – |
| `end_date` | string (date) | – | – | – |
| `repeat_mode` | string (enum: `weeks`, `until_change`) | – | `"weeks"` | – |
| `repeat_weeks` | number | – | – | – |
| `status` | string (enum: `active`, `paused`, `cancelled`) | – | `"active"` | – |
| `skipped_dates` | array\<string\> | – | – | – |
| `last_confirmed_date` | string (date) | – | – | – |

## Shot

A single logged dose. Route-specific fields are only filled for the route they belong to.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `medication` | string | Yes | – | Medication (by **name**) |
| `medication_id` | string | – | – | **Medication** |
| `dose` | number | Yes | – | – |
| `dose_unit` | string | – | `"mg"` | – |
| `dose_source` | string (enum: `label`, `custom`) | – | – | – |
| `concentration` | string | – | – | – |
| `drug_class` | string | – | – | – |
| `molecular_class` | string | – | – | – |
| `route` | string | – | – | – |
| `device_type` | string (enum: `prefilled_syringe`, `single_dose_pen`, `multidose_pen`, `vial_syringe`, `pump`, `patch`, `other`) | – | – | – |
| `date` | string | Yes | – | – |
| `time` | string | Yes | – | – |
| `timezone` | string | – | – | – |
| `logged_at_utc` | string | – | – | – |
| `site` | string | – | – | – |
| `pain` | number | – | – | – |
| `notes` | string | – | – | – |
| `reconstitution_date` | string (date) | – | – | – |
| `in_use_expiry` | string (date) | – | – | – |
| `infusion_duration` | number | – | – | – |
| `clinic_location` | string | – | – | – |
| `premedication` | boolean | – | – | – |
| `spray_count` | number | – | – | – |
| `nostril` | string (enum: `left`, `right`, `both`) | – | – | – |
| `priming` | boolean | – | – | – |
| `taken_with_food` | boolean | – | – | – |
| `patch_site` | string | – | – | – |
| `application_date` | string (date) | – | – | – |
| `body_area` | string | – | – | – |
| `application_notes` | string | – | – | – |
| `insertion_date` | string (date) | – | – | – |
| `pump_rate` | number | – | – | – |
| `site_change_date` | string (date) | – | – | – |

## StorageLog

A storage check on a tracked product, including any temperature excursion.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `inventory_id` | string | – | – | **Inventory** |
| `product_name` | string | Yes | – | – |
| `logged_date` | string (date) | Yes | – | – |
| `temperature_excursion` | boolean | – | – | – |
| `notes` | string | – | – | – |

## User

The built-in account entity. `id`, `created_date`, `full_name` and `email` are supplied by the platform and are read-only. Records cannot be created directly — users join by invitation.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `id` | string | Yes (built-in) | – | – |
| `created_date` | string (ISO timestamp) | Yes (built-in) | – | – |
| `full_name` | string | Yes (built-in) | – | – |
| `email` | string | Yes (built-in) | – | – |
| `role` | string (enum: `admin`, `user`) | Yes | `"user"` | – |
| `username` | string | – | – | – |
| `username_lc` | string | – | – | – |

## UserProfile

The person's settings, units, consent records and onboarding answers.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `height_ft` | string | – | – | – |
| `height_in` | string | – | – | – |
| `height_cm` | number | – | – | – |
| `goal_weight` | string | – | – | – |
| `goal_weight_kg` | number | – | – | – |
| `days_between` | string | – | – | – |
| `days_between_override` | string | – | – | – |
| `interval_migrated_at` | string | – | – | – |
| `liquid_unit` | string | – | – | – |
| `height_unit` | string | – | – | – |
| `weight_unit` | string | – | – | – |
| `default_medication` | string | – | – | Medication (by **name**) |
| `dark_mode` | boolean | – | – | – |
| `onboarding_completed` | boolean | – | – | – |
| `units_migrated_at` | string | – | – | – |
| `inventory_migrated_at` | string | – | – | – |
| `unit_check_status` | string | – | – | – |
| `birthdate` | string (date) | – | – | – |
| `gdpr_consent_date` | string | – | – | – |
| `gdpr_privacy_policy_version` | string | – | – | – |
| `age_confirmed_at` | string | – | – | – |
| `parental_consent_date` | string | – | – | – |
| `parental_consent_name` | string | – | – | – |
| `plan_type` | string (enum: `free`, `monthly`, `yearly`, `lifetime`) | – | `"free"` | – |
| `subscription_status` | string | – | – | – |
| `premium_until` | string | – | – | – |
| `first_name` | string | – | – | – |
| `prescriber_name` | string | – | – | – |
| `prescriber_contact` | string | – | – | – |
| `weight_tracking_opted_in` | boolean | – | `false` | – |
| `tracking_modules` | array\<string\> | – | – | – |
| `custom_doses` | array\<object\> (`medication` string, `dose` number) | – | – | Medication (by **name**) |

## UserSubscription

The Apple in-app purchase record that gates premium access.

| Field | Type | Required | Default | Reference |
| --- | --- | --- | --- | --- |
| `user_id` | string | Yes | – | **User** |
| `product_id` | string | – | – | – |
| `purchase_date` | integer (unix seconds) | – | – | – |
| `expiration_date` | integer (unix seconds) | Yes | – | – |
| `original_transaction_id` | string | – | – | – |
| `consumed_product_discount_id` | string | – | – | – |

---

## Reference map

Every field that points at another entity.

| From | Field | Points to |
| --- | --- | --- |
| (all entities) | `created_by_id` | User |
| AdverseEvent | `journal_entry_id` | JournalEntry |
| Inventory | `medication_id` | Medication |
| ProxyAccess | `grantee_user_id` | User |
| PushOutbox | `recipient_user_id` | User |
| RepeatSchedule | `medication_id` | Medication |
| Shot | `medication_id` | Medication |
| StorageLog | `inventory_id` | Inventory |
| UserSubscription | `user_id` | User |

Fields that name a medication but hold no id — `AdverseEvent.medication_name`, `RepeatSchedule.medication`, `Shot.medication`, `UserProfile.default_medication`, and `UserProfile.custom_doses[].medication` — match a Medication record by its `medication_name`, not by a stored id.

`Medication.catalogue_id` is not a reference to an entity: it points at an entry in the app's static medication catalogue in code.

## Relationship overview

```
User ──1:1── UserProfile
User ──1:many── Shot ──many:1── Medication
User ──1:many── Medication
User ──1:many── RepeatSchedule ──many:1── Medication
User ──1:many── Inventory ──many:1── Medication
Inventory ──1:many── StorageLog
User ──1:many── DayMetric
User ──1:many── JournalEntry ──1:many── AdverseEvent
User ──1:many── ProgressPhoto
User ──1:many── ProxyAccess
User ──1:1── UserSubscription
User ──1:many── PushOutbox (server-only)
`