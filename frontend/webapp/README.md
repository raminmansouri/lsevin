# L-Sevin Web Application

A modern, secure, and feature-rich authentication system built with Next.js 15, TypeScript, and Tailwind CSS. This project implements a comprehensive authentication flow including sign-up, sign-in, OTP verification, and password recovery.

## 🚀 Features

- 🔐 Complete authentication system
  - Sign up with email/phone verification
  - Sign in with credentials
  - OTP verification
  - Password recovery flow
  - Email verification
  - Sign out functionality
- 🎨 Modern UI with Tailwind CSS and Shadcn UI
- 📱 Responsive design for all devices
- 🔒 Secure authentication with JWT
- 🌐 Server-side rendering with Next.js
- 📝 Form validation with Zod and React Hook Form
- 🎯 Type safety with TypeScript
- 🔄 State management with Zustand
- 🎨 Theme customization with next-themes
- 📊 Data fetching with Axios

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:**
  - Radix UI
  - Shadcn UI
  - React Aria Components
- **Form Management:** React Hook Form
- **Validation:** Zod
- **State Management:** Zustand
- **Authentication:** NextAuth.js
- **HTTP Client:** Axios
- **Date Handling:** date-fns
- **Icons:** Lucide React
- **Toast Notifications:** Sonner
- **Charts:** Recharts

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/pouryanoufallah96/l-sevin.git
cd l-sevin
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Start the development server:

```bash
pnpm dev
```

The application will be available at http://localhost:3000

## 🔧 Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm prettier` - Format code
- `pnpm prettier:check` - Check code formatting
- `pnpm outdated` - Check for outdated dependencies
- `pnpm compiler-health` - Check React compiler health

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication routes
│   └── ...                # Other routes
├── features/              # Feature-based modules
│   ├── auth/             # Authentication feature
│   │   ├── actions/      # Server actions
│   │   ├── components/   # Auth components
│   │   └── types/        # Type definitions
│   └── ...               # Other features
└── ...                   # Other source files
```

## 🔒 Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# API Configuration
NEXT_PUBLIC_API_URL=your-api-url
```

## 🚀 Deployment

This application can be deployed on [Vercel](https://vercel.com) with zero configuration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/l-sevin)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 👏 Acknowledgments

- [Next.js](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Shadcn UI](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)
- [Vercel](https://vercel.com)
