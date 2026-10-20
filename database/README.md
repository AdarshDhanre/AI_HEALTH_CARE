# Database

- `schema.sql` is a copy of `backend-java/src/main/resources/db/migration/V1__init_schema.sql`.
  **Flyway owns the schema**: change it by adding `V2__...sql` migrations, never by editing V1 after first run.
- `seed_demo_data.sql` adds two demo patients to a doctor account you create via the app.
