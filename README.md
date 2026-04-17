# ⚡ NexusConnect — Student Networking & Collaboration Platform

<div align="center">

![NexusConnect](https://img.shields.io/badge/NexusConnect-Student%20Networking-6c5ce7?style=for-the-badge&logo=lightning&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

**A full-stack MERN networking platform where students create profiles, discover collaborators with matching skills and interests, send collaboration requests, form project teams, and maintain records of past collaborations.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure) • [API Endpoints](#-api-endpoints) • [Screenshots](#-screenshots)

</div>

---

## 🌟 Features

### 👤 Rich Student Profiles
- Create comprehensive profiles with **skills, interests, and projects**
- Interactive **SVG radar/spider chart** for visualizing skill levels
- Add project portfolios with tech stacks and links
- Glowing **neon skill tags** with 5 color variants

### 🎯 Smart Matching Algorithm
- Discover students with **similar interests and complementary skills**
- Match percentage calculated based on shared skills & interests
- Filter by **high match**, **has skills**, or **has projects**
- Search by name, skills, or interests

### ⚡ Collaboration Requests
- Send collaboration requests with **project ideas and messages**
- Accept or reject incoming requests
- Real-time **toast notifications** for new requests via Socket.io
- Track sent and received requests with status indicators

### 👥 Team Formation
- Create project teams with name, description, and tech stack
- Add members to teams from the user pool
- Track project status: **Planning → In Progress → Completed**
- Team lead management (only leads can modify teams)

### 📊 Collaboration History
- Beautiful **timeline view** of all past collaborations
- Track active vs completed projects
- Record collaboration outcomes
- View participant details for each collaboration

### 🎨 Stunning Interactive UI
- **Cosmic dark-mode theme** with gradient mesh backgrounds
- **Animated particle constellation** background (mouse-reactive canvas)
- **Glassmorphism** cards, modals, and navigation
- **Micro-animations** — hover effects, skeleton loaders, slide-in toasts
- Fully **responsive design** for all screen sizes

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | UI framework + build tool |
| **Styling** | Vanilla CSS | 1000+ line custom design system |
| **Routing** | React Router v6 | Client-side navigation |
| **State** | React Context API | Auth & toast management |
| **Backend** | Node.js + Express | REST API server |
| **Database** | MongoDB + Mongoose | NoSQL data storage |
| **Auth** | JWT + bcryptjs | Secure authentication |
| **Real-time** | Socket.io | Live notifications |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/nexusconnect.git
   cd nexusconnect
   ```

2. **Set up the backend**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**
   
   Edit `server/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/nexusconnect
   JWT_SECRET=your_secret_key_here
   ```
   > For MongoDB Atlas, replace `MONGO_URI` with your connection string.

4. **Set up the frontend**
   ```bash
   cd ../client
   npm install
   ```

5. **Run the application**

   Open **two terminals**:

   ```bash
   # Terminal 1 — Backend (runs on http://localhost:5000)
   cd server
   npm run dev

   # Terminal 2 — Frontend (runs on http://localhost:5173)
   cd client
   npm run dev
   ```

6. **Open your browser** at `http://localhost:5173`

---

## 📁 Project Structure

```
nexusconnect/
├── server/                        # Express Backend
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   └── auth.js               # JWT verification
│   ├── models/
│   │   ├── User.js               # User schema (skills, interests, projects)
│   │   ├── CollaborationRequest.js # Request schema
│   │   ├── Team.js               # Team schema
│   │   └── Collaboration.js      # Collaboration history schema
│   ├── routes/
│   │   ├── auth.js               # Register, login, current user
│   │   ├── users.js              # Discover, match, profile
│   │   ├── collaborations.js     # Requests & history
│   │   └── teams.js              # CRUD + member management
│   ├── server.js                 # Entry point + Socket.io
│   ├── .env                      # Environment variables
│   └── package.json
│
├── client/                        # React + Vite Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js          # Configured HTTP client
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Auth state management
│   │   │   └── ToastContext.jsx  # Toast notifications
│   │   ├── components/
│   │   │   ├── ParticleBackground.jsx  # Animated canvas
│   │   │   ├── Navbar.jsx              # Navigation bar
│   │   │   ├── SkillTag.jsx            # Neon skill pills
│   │   │   ├── ProfileCard.jsx         # User display card
│   │   │   └── RadarChart.jsx          # SVG radar chart
│   │   ├── pages/
│   │   │   ├── Landing.jsx       # Hero + features
│   │   │   ├── Login.jsx         # Sign in
│   │   │   ├── Register.jsx      # Sign up
│   │   │   ├── Dashboard.jsx     # Overview + stats
│   │   │   ├── Discover.jsx      # Find collaborators
│   │   │   ├── Profile.jsx       # Edit profile
│   │   │   ├── Teams.jsx         # Team management
│   │   │   └── CollaborationHistory.jsx # Timeline
│   │   ├── App.jsx               # Root + routing
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Complete design system
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login & get token |
| `GET` | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List users (with filters) |
| `GET` | `/api/users/matches` | Get matched users (sorted by %) |
| `GET` | `/api/users/:id` | Get user by ID |
| `PUT` | `/api/users/profile` | Update profile |

### Collaboration Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/collaborations/requests` | Send request |
| `GET` | `/api/collaborations/requests` | Get requests (sent/received) |
| `PUT` | `/api/collaborations/requests/:id` | Accept/reject |
| `GET` | `/api/collaborations/history` | Get collaboration history |
| `PUT` | `/api/collaborations/:id` | Update collaboration |

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/teams` | Create team |
| `GET` | `/api/teams` | Get user's teams |
| `GET` | `/api/teams/:id` | Get team by ID |
| `PUT` | `/api/teams/:id` | Update team |
| `POST` | `/api/teams/:id/members` | Add member |
| `DELETE` | `/api/teams/:id/members/:userId` | Remove member |

---

## 📐 Database Models

### User
```javascript
{
  name, email, password (hashed),
  avatar, bio, university, year,
  skills: [String],
  interests: [String],
  projects: [{ title, description, techStack, link }],
  skillLevels: Map<String, Number>,
  collaborations: [ref → Collaboration]
}
```

### CollaborationRequest
```javascript
{
  from: ref → User,
  to: ref → User,
  message, status: 'pending' | 'accepted' | 'rejected',
  projectIdea: { title, description }
}
```

### Team
```javascript
{
  name, description,
  members: [ref → User],
  lead: ref → User,
  project: { title, description, techStack, status }
}
```

### Collaboration
```javascript
{
  team: ref → Team,
  participants: [ref → User],
  project: { title, description, outcome },
  startDate, endDate,
  status: 'active' | 'completed'
}
```

---

## 🎨 Design Highlights

- **Color Palette**: Deep cosmic purples (`#0a0a1a`, `#6c5ce7`, `#a29bfe`) with pink (`#fd79a8`) and cyan (`#00cec9`) accents
- **Typography**: Inter + Space Grotesk from Google Fonts
- **Glass Effects**: `backdrop-filter: blur(20px)` with semi-transparent borders
- **Animations**: Particle canvas, fade-in-up transitions, hover lifts, skeleton shimmer, toast slide-ins
- **Responsive**: Fully responsive grid layouts with mobile breakpoints

---

## 🔮 User Flow

```
Register → Complete Profile (skills, interests, projects)
    ↓
Dashboard (stats, pending requests, top matches)
    ↓
Discover (search, filter, view profiles, send requests)
    ↓
Accept Request → Collaboration Created
    ↓
Form Team → Add Members → Track Project
    ↓
Mark Complete → Collaboration History
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for students, by students**

⚡ NexusConnect — Connect. Collaborate. Create.

</div>
