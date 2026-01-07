#!/bin/bash

# Storyflow - AI-Powered Novel Writing Assistant
# Development Environment Setup Script

set -e

echo "========================================"
echo "  Storyflow Development Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ required. Current version: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Check Claude CLI (optional but recommended)
if command -v claude &> /dev/null; then
    echo -e "${GREEN}✓ Claude CLI installed${NC}"

    # Check if logged in
    if claude auth status &> /dev/null; then
        echo -e "${GREEN}✓ Claude CLI authenticated${NC}"
    else
        echo -e "${YELLOW}! Claude CLI not authenticated. Run 'claude login' when ready.${NC}"
    fi
else
    echo -e "${YELLOW}! Claude CLI not found. Install for AI features.${NC}"
    echo "  Visit: https://docs.anthropic.com/claude/docs/claude-cli"
fi

echo ""
echo -e "${BLUE}Setting up the project...${NC}"
echo ""

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend
npm install
cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

echo ""
echo -e "${GREEN}========================================"
echo "  Setup Complete!"
echo "========================================${NC}"
echo ""
echo "To start the development servers:"
echo ""
echo -e "${BLUE}1. Start the backend server:${NC}"
echo "   cd backend && npm run dev"
echo ""
echo -e "${BLUE}2. In a new terminal, start the frontend:${NC}"
echo "   cd frontend && npm run dev"
echo ""
echo -e "${BLUE}Access the application at:${NC}"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo -e "${YELLOW}Note: Make sure Claude CLI is authenticated before using AI features:${NC}"
echo "   claude login"
echo ""
echo "Happy writing!"
