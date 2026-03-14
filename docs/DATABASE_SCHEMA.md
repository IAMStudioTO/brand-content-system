# Brand Content System — Database Schema (V1)

Database consigliato: PostgreSQL (multi-tenant logico per workspace/brand).

## 1) Core entities

### `users`
- `id` UUID PK
- `email` TEXT UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL
- `role` TEXT NOT NULL CHECK (`role` IN ('admin','client'))
- `created_at` TIMESTAMPTZ DEFAULT now()

### `brands`
- `id` UUID PK
- `name` TEXT NOT NULL
- `created_at` TIMESTAMPTZ DEFAULT now()

### `workspaces`
- `id` UUID PK
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `name` TEXT NOT NULL
- `format_default` TEXT NOT NULL DEFAULT 'linkedin-1080x1350'
- `created_at` TIMESTAMPTZ DEFAULT now()

### `workspace_members`
- `workspace_id` UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `role` TEXT NOT NULL CHECK (`role` IN ('admin','client'))
- PK (`workspace_id`, `user_id`)

## 2) Brand pack

### `brand_packs`
- `id` UUID PK
- `workspace_id` UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
- `palette` JSONB NOT NULL
- `fonts` JSONB NOT NULL
- `tone_of_voice` TEXT
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now()

## 3) Templates and slots

### `templates`
- `id` UUID PK
- `workspace_id` UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
- `external_ref` TEXT NOT NULL  -- id frame/plugin
- `name` TEXT NOT NULL
- `format` TEXT NOT NULL
- `width` INT NOT NULL
- `height` INT NOT NULL
- `is_active` BOOLEAN NOT NULL DEFAULT true
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now()
- UNIQUE (`workspace_id`, `external_ref`)

### `template_slots`
- `id` UUID PK
- `template_id` UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE
- `slot_name` TEXT NOT NULL
- `slot_type` TEXT NOT NULL CHECK (`slot_type` IN ('text','image','svg'))
- `x` INT NOT NULL
- `y` INT NOT NULL
- `width` INT NOT NULL
- `height` INT NOT NULL
- `z_index` INT NOT NULL
- `is_visible` BOOLEAN NOT NULL DEFAULT true
- `style` JSONB
- `rules` JSONB
- UNIQUE (`template_id`, `slot_name`)

## 4) SVG assets

### `svg_assets`
- `id` UUID PK
- `workspace_id` UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
- `name` TEXT NOT NULL
- `category` TEXT NOT NULL CHECK (`category` IN ('background','decorative','accent','frame'))
- `storage_url` TEXT NOT NULL
- `weight` TEXT CHECK (`weight` IN ('light','medium','bold'))
- `scale_min` NUMERIC(5,2)
- `scale_max` NUMERIC(5,2)
- `typical_z_index` INT
- `style_tag` TEXT
- `is_active` BOOLEAN NOT NULL DEFAULT true
- `created_at` TIMESTAMPTZ DEFAULT now()

### `svg_asset_compatibilities`
- `svg_asset_id` UUID NOT NULL REFERENCES svg_assets(id) ON DELETE CASCADE
- `template_id` UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE
- `slot_name` TEXT NOT NULL
- PK (`svg_asset_id`, `template_id`, `slot_name`)

## 5) Generated content

### `generated_contents`
- `id` UUID PK
- `workspace_id` UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
- `requested_by` UUID NOT NULL REFERENCES users(id)
- `content_mode` TEXT NOT NULL CHECK (`content_mode` IN ('single','carousel'))
- `number_of_slides` INT NOT NULL CHECK (`number_of_slides` >= 1)
- `prompt` TEXT NOT NULL
- `status` TEXT NOT NULL CHECK (`status` IN ('draft','ready','exported','failed'))
- `created_at` TIMESTAMPTZ DEFAULT now()

### `generated_slides`
- `id` UUID PK
- `generated_content_id` UUID NOT NULL REFERENCES generated_contents(id) ON DELETE CASCADE
- `slide_index` INT NOT NULL
- `role` TEXT NOT NULL
- `template_id` UUID NOT NULL REFERENCES templates(id)
- `text_assignments` JSONB NOT NULL
- `svg_assignments` JSONB NOT NULL
- `image_requirements` JSONB NOT NULL DEFAULT '[]'::jsonb
- `cta` BOOLEAN NOT NULL DEFAULT false
- UNIQUE (`generated_content_id`, `slide_index`)

## 6) Audit log

### `audit_events`
- `id` UUID PK
- `workspace_id` UUID REFERENCES workspaces(id) ON DELETE CASCADE
- `user_id` UUID REFERENCES users(id)
- `event_type` TEXT NOT NULL
- `payload` JSONB NOT NULL
- `created_at` TIMESTAMPTZ DEFAULT now()

## 7) Indexes consigliati
- `templates(workspace_id, is_active)`
- `template_slots(template_id, slot_type)`
- `svg_assets(workspace_id, category, is_active)`
- `generated_contents(workspace_id, created_at DESC)`
- `generated_slides(generated_content_id, slide_index)`
- `audit_events(workspace_id, created_at DESC)`

## 8) Notes tenancy
- Ogni query applicativa deve essere filtrata per `workspace_id`.
- Non condividere template/assets tra workspace in V1.
- Solo membri `admin` possono mutare template/assets/compatibilità.
