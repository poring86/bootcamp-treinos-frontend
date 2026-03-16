# Bootcamp Treinos - Frontend

Este é o frontend do ecossistema **Bootcamp Treinos**, desenvolvido com Next.js para oferecer uma experiência interativa e moderna de gestão de treinos com suporte a IA.

## 🚀 Tecnologias

- **Next.js 16**: Framework principal com App Router.
- **Tailwind CSS**: Estilização baseada em utilitários.
- **Lucide React**: Biblioteca de ícones.
- **Better-Auth**: Cliente de autenticação para integração com o backend.
- **React Hook Form & Zod**: Gerenciamento de estado e validação de formulários.
- **AI SDK (Vercel)**: Integração para streaming de respostas do chat.

---

## 🛠️ Como Utilizar

### Requisitos
- Node.js 24 (recomendado via `nvm`).
- Backend em execução (veja o README da pasta `bootcamp-treinamentos-api`).

### Instalação e Execução Local

1. Instale as dependências:
   ```bash
   pnpm install
   ```
2. Configure o arquivo `.env.local` (veja a seção de Variáveis de Ambiente).
3. Inicie o servidor de desenvolvimento:
   ```bash
   pnpm run dev
   ```
4. Acesse `http://localhost:3000`.

---

## ⚙️ Variáveis de Ambiente (.env.local)

- `NEXT_PUBLIC_API_URL`: URL base do backend (ex: `http://localhost:8080`).

---

## 📁 Estrutura do Projeto

- `/app`: Rotas e páginas da aplicação.
- `/components`: Componentes reutilizáveis de UI.
- `/lib`: Configurações de clientes (API, Auth).
- `/public`: Ativos estáticos (imagens, favicons).

---

## 🤝 Integração com Backend

O frontend depende do backend para:
- Autenticação (Google OAuth via Better-Auth).
- Chat de IA e Geração de Treinos.
- Persistência de dados do usuário e estatísticas.

A maneira mais fácil de rodar o ecossistema completo é utilizando o **Docker Compose** localizado na pasta do backend.
