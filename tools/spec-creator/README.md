# A.R.I. Specialization Creator

**Internal Tool • For Automattic/Jann Use Only**

A professional standalone web application for creating `.ari-spec.json` files without manual JSON editing. This tool provides a guided 4-step wizard interface with live JSON preview, validation, and import/export capabilities.

## Features

✨ **4-Step Wizard Interface**
- Basic Info: Name, ID, version, category, icon, description
- System Prompt: Define AI agent behavior with templates
- Features: Create feature list with descriptions
- Preview: Live JSON preview, copy, download, import

🎨 **Professional UI**
- Clean SaaS admin panel aesthetic
- Real-time form validation
- Progress indicators and step navigation
- Responsive design (desktop & tablet optimized)

🚀 **Powerful Features**
- Auto-generate kebab-case IDs from names
- Emoji picker for specialization icons
- System prompt quick templates
- Live JSON preview (formatted & minified)
- Copy to clipboard functionality
- Download `.ari-spec.json` files
- Import existing `.ari-spec.json` files to edit
- Comprehensive validation with error messages

## Installation

```bash
cd tools/spec-creator
npm install
```

## Usage

```bash
npm run dev
```

Opens automatically at `http://localhost:5174`

### Development
```bash
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Project Structure

```
spec-creator/
├── src/
│   ├── components/          # React components
│   │   ├── StepNavigation.tsx      # Progress bar & navigation
│   │   ├── BasicInfoStep.tsx       # Step 1: Basic information
│   │   ├── SystemPromptStep.tsx    # Step 2: AI prompt
│   │   ├── FeaturesStep.tsx        # Step 3: Features list
│   │   └── PreviewStep.tsx         # Step 4: JSON preview & export
│   ├── types/
│   │   └── spec.types.ts           # TypeScript type definitions
│   ├── utils/
│   │   ├── validation.ts           # Form & JSON validation
│   │   └── download.ts             # File download utilities
│   ├── App.tsx                     # Main application component
│   ├── main.tsx                    # React DOM render
│   └── index.css                   # Tailwind CSS directives
├── index.html                      # HTML entry point
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS config
├── postcss.config.js               # PostCSS config
├── vite.config.ts                  # Vite bundler config
└── package.json                    # Dependencies & scripts
```

## Technologies

- **React 18.2**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast development bundler (port 5174)
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **PostCSS**: CSS processing

## Output Format

The tool generates `.ari-spec.json` files with the following structure:

```json
{
  "name": "WooCommerce Product Manager",
  "id": "woocommerce-product-manager",
  "version": "1.0.0",
  "category": "Productivity",
  "icon": "🛍️",
  "description": "Manages WooCommerce products...",
  "systemPrompt": "You are a specialized WooCommerce agent...",
  "features": [
    {
      "id": "feature-1",
      "name": "Automated Product Creation",
      "description": "Creates products from descriptions"
    }
  ],
  "metadata": {
    "createdAt": "2024-01-15T10:30:00.000Z",
    "author": "Internal Tool"
  }
}
```

## Validation Rules

- **Name**: Required, max 100 characters
- **ID**: Required, kebab-case only (a-z, 0-9, -)
- **Version**: Required, semver format (e.g., 1.0.0)
- **Category**: Required, predefined options
- **System Prompt**: Required, max 5000 characters
- **Features**: At least one feature required
  - Feature Name: Required
  - Feature Description: Required

## Notes

⚠️ **Internal Use Only**: This tool is NOT part of A.R.I. production or customer-facing releases.

🔒 **No Data Persistence**: All data exists only in the browser session. Use export/download to save.

📦 **Standalone**: Can be deployed independently for internal team use.

## Future Enhancements

- [ ] Save/load from browser localStorage
- [ ] Spec templates for common use cases
- [ ] Spec versioning & history
- [ ] Team collaboration features
- [ ] Integration with A.R.I. dashboard

---

**Created for**: Internal Automattic/Jann tooling  
**Maintained by**: A.R.I. Development Team
