# Database Schema for Brand Content System

## 1. Users Table
- **Table Name**: `users`
- **Fields**:
  - `id`: UUID (Primary Key)
  - `username`: VARCHAR(255) (Unique, Not Null)
  - `email`: VARCHAR(255) (Unique, Not Null)
  - `password_hash`: VARCHAR(255) (Not Null)
  - `created_at`: TIMESTAMP (Default: now())
  - `updated_at`: TIMESTAMP (Default: now())

## 2. Brands Table
- **Table Name**: `brands`
- **Fields**:
  - `id`: UUID (Primary Key)
  - `user_id`: UUID (Foreign Key referencing `users.id`, Not Null)
  - `name`: VARCHAR(255) (Not Null)
  - `created_at`: TIMESTAMP (Default: now())
  - `updated_at`: TIMESTAMP (Default: now())

## 3. Workspaces Table
- **Table Name**: `workspaces`
- **Fields**:
  - `id`: UUID (Primary Key)
  - `brand_id`: UUID (Foreign Key referencing `brands.id`, Not Null)
  - `name`: VARCHAR(255) (Not Null)
  - `created_at`: TIMESTAMP (Default: now())
  - `updated_at`: TIMESTAMP (Default: now())

## 4. Templates Table
- **Table Name**: `templates`
- **Fields**:
  - `id`: UUID (Primary Key)
  - `workspace_id`: UUID (Foreign Key referencing `workspaces.id`, Not Null)
  - `name`: VARCHAR(255) (Not Null)
  - `definition`: JSONB (Not Null)  
  - `created_at`: TIMESTAMP (Default: now())
  - `updated_at`: TIMESTAMP (Default: now())

## 5. Text Slots Table
- **Table Name**: `text_slots`
- **Fields**:
  - `id`: UUID (Primary Key)
  - `template_id`: UUID (Foreign Key referencing `templates.id`, Not Null)
  - `content`: TEXT (Not Null)
  - `created_at`: TIMESTAMP (Default: now())
  - `updated_at`: TIMESTAMP (Default: now())

## 6. Image Slots Table
- **Table Name**: `image_slots`
- **Fields**:
  - `id`: UUID (Primary Key)
  - `template_id`: UUID (Foreign Key referencing `templates.id`, Not Null)
  - `image_url`: VARCHAR(255) (Not Null)
  - `created_at`: TIMESTAMP (Default: now())
  - `updated_at`: TIMESTAMP (Default: now())

## 7. SVG Slots Table
- **Table Name**: `svg_slots`
- **Fields**:
  - `id`: UUID (Primary Key)
  - `template_id`: UUID (Foreign Key referencing `templates.id`, Not Null)
  - `svg_data`: TEXT (Not Null)
  - `created_at`: TIMESTAMP (Default: now())
  - `updated_at`: TIMESTAMP (Default: now())

## 8. SVG Assets Table
- **Table Name**: `svg_assets`
- **Fields**:
  - `id`: UUID (Primary Key)
  - `user_id`: UUID (Foreign Key referencing `users.id`, Not Null)
  - `svg_data`: TEXT (Not Null)
  - `created_at`: TIMESTAMP (Default: now())
  - `updated_at`: TIMESTAMP (Default: now())

## 9. Generated Slides Table
- **Table Name**: `generated_slides`
- **Fields**:
  - `id`: UUID (Primary Key)
  - `template_id`: UUID (Foreign Key referencing `templates.id`, Not Null)
  - `content`: JSONB (Not Null)
  - `created_at`: TIMESTAMP (Default: now())

## 10. Generated Campaigns Table
- **Table Name**: `generated_campaigns`
- **Fields**:
  - `id`: UUID (Primary Key)
  - `brand_id`: UUID (Foreign Key referencing `brands.id`, Not Null)
  - `created_at`: TIMESTAMP (Default: now())

## Relationships:
- `users` to `brands`: One-to-Many  
- `brands` to `workspaces`: One-to-Many  
- `workspaces` to `templates`: One-to-Many  
- `templates` to `text_slots`: One-to-Many  
- `templates` to `image_slots`: One-to-Many  
- `templates` to `svg_slots`: One-to-Many  
- `users` to `svg_assets`: One-to-Many  
- `templates` to `generated_slides`: One-to-Many  
- `brands` to `generated_campaigns`: One-to-Many  

## Indexes and Constraints:
- Add indexes on foreign key columns for performance.
- Ensure unique constraints where applicable (e.g., `users.email`, `brands.name`).

---

Generated on: 2026-03-14 08:59:30 UTC