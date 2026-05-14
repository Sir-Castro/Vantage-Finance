# Vantage Finance

**Vantage Finance** is an AI-powered intelligence platform that transforms raw cryptocurrency market data into actionable insights, providing real-time summaries and sentiment analysis to help you navigate the digital asset landscape with confidence. By leveraging advanced Large Language Models (LLMs), the platform distills high-frequency market indicators into clear, structured sentiment analysis.

## 🌟 Key Features
- **AI Market Summaries**: Real-time analysis of price action, volume, and volatility across major digital assets.
- **Sentiment Analytics**: Algorithmic assessment of market "mood" (Bullish/Bearish/Neutral) to help gauge retail and institutional pressure.
- **Cross-Platform Experience**: A unified intelligence layer served via a high-performance Express backend and a premium React Native (Expo) mobile interface.
- **Portfolio Intelligence**: Integrated tracking that allows users to see their holdings through the lens of real-time AI summaries.

## 🛠️ Technology Stack
- **Monorepo Management**: [pnpm Workspaces](https://pnpm.io/workspaces)
- **Frontend**: [React Native](https://reactnative.dev/) / [Expo](https://expo.dev/) with [Expo Router](https://docs.expo.dev/router/introduction/)
- **Backend**: [Node.js](https://nodejs.org/) & [Express 5](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **AI**: [OpenAI GPT Models](https://openai.com/)
- **Validation**: [Zod](https://zod.dev/)

## 🚀 Getting Started

### Prerequisites
- Node.js (v24 or later recommended)
- pnpm (`npm install -g pnpm`)
- A [PostgreSQL](https://www.postgresql.org/) instance

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Sir-Castro/Vantage-Finance.git
   cd Vantage-Finance
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up your environment variables (refer to `.env.example` in respective apps).

### Running Locally
- **Start API Server**:
  ```bash
  pnpm --filter @workspace/api-server run dev
  ```
- **Start Mobile App**:
  ```bash
  pnpm --filter @workspace/mobile run dev
  ```

## 📄 License
This project is proprietary software. See the [LICENSE](LICENSE) file for more information.

---
© 2026 Fidel Mbeo. All Rights Reserved.
