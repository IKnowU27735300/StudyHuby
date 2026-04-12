# 🎓 StudyHub: The Ultimate Academic Resource Vault

[![Vercel Deployment](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://studyhuby.vercel.app)
[![Next.js](https://img.shields.io/badge/Built%20With-Next.js%2015-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/State-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%207-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)

StudyHub is a premium, state-of-the-art academic platform designed to streamline the sharing and discovery of educational resources. Built with a sleek, high-contrast aesthetic, it offers a hybrid infrastructure (MongoDB + Firestore) for a seamless experience in managing notes, papers, and exam materials.

---

## 🌟 Key Features

### 📁 Resource Management
- **Study Materials**: Share and discover notes, manuals, and documents (PDF, PNG, JPG).
- **Question Papers**: Access previous year exams categorized by **Regular**, **Makeup**, and **Reexam**.
- **Research Papers**: A dedicated vault for academic publications with abstract previews.
- **Model Papers**: Practice with curated model question sets without difficulty distractions.

### 🌓 Premium Experience
- **Adaptive Theme**: Seamless toggle between sleek **Dark Mode** (Black & Gold) and crisp **Light Mode**.
- **Collapsible Sidebar**: A flexible navigation system that collapses to icon-only mode for maximum focus.
- **Glassmorphism UI**: Modern, translucent design elements that feel extremely premium.

### 👤 Social & Engagement
- **Follower System**: Follow your peers and build a network of academic contributors.
- **Real-time Storage Vault**: A centralized hub in **Settings** to manage all your uploads with live file counts and direct deletion across 4 resource categories.
- **Usage Metrics**: Interactive storage indicator with quota tracking (**500MB Limit**) and real-time occupied space calculations.
- **Login Streaks**: Keep your study momentum alive with a gamified streak system.

---

## 🏗️ Architecture & Flow

### System Block Diagram

```mermaid
graph TD
    A[Client - Next.js 15 App] --> B[Authentication - Firebase Auth]
    B --> C[Authorized Access]
    C --> D[Resource Upload - Firebase Storage]
    C --> E[Real-time Metadata - Firestore]
    C --> F[User/Social Data - Prisma + MongoDB Atlas]
    
    subgraph "Frontend Layer"
        G[Dashboard Layout]
        H[Sidebar Navigation]
        I[TopBar & Profile]
    end
    
    subgraph "State Management"
        J[AuthContext]
        K[SidebarContext]
        L[ThemeContext]
    end
    
    A --- G
    G --- H
    H --- K
```

### Data Flow for Resource Upload

```mermaid
sequenceDiagram
    participant User
    participant App as StudyHub App
    participant Storage as Firebase Storage
    participant DB as Firestore / PostgreSQL

    User->>App: Select File (PDF/PNG/JPG)
    App->>App: Validate Format
    App->>Storage: Upload Encrypted Blob
    Storage-->>App: Return Download URL
    App->>DB: Store Metadata (URL, Subject, Type)
    DB-->>App: Sync Confirmed
    App->>User: Display Success Toast
```

---

## 🛠️ Tech Stack

- **Core**: [Next.js 16+](https://nextjs.org) (App Router), [React 19](https://react.dev)
- **Styling**: Vanilla CSS, [Framer Motion](https://framer.com/motion), [Lucide React Icons](https://lucide.dev)
- **Database/ORM**: [Prisma 6+](https://prisma.io), [MongoDB Atlas](https://mongodb.com)
- **State/Real-time**: [Google Firebase](https://firebase.google.com) (Auth, Firestore, Storage)
- **Persistence**: Vercel

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Firebase Account & Config](https://console.firebase.google.com)
- [MongoDB Atlas Connection URI](https://mongodb.com) (Check `.env.example`)

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/username/studyhub.git
    cd studyhub
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Create a `.env` file in the root directory:
    ```bash
    DATABASE_URL="your_postgresql_url"
    NEXT_PUBLIC_FIREBASE_API_KEY="..."
    # ... other firebase keys
    ```

4.  **Generate Prisma Client**:
    ```bash
    npx prisma generate
    ```

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by the StudyHub Team
</p>
