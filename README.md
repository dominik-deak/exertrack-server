# ExerTrack Web Server

## Overview

The ExerTrack web server serves as the backbone of the ExerTrack application, providing API endpoints for data retrieval and processing. Built with Node.js and Express.js, the server manages user authentication, handles workout data, and interfaces with a machine-learning model to provide personalized recommendations.

## Features

- **API Endpoints:** Provides a RESTful API for client-side applications to interact with the server, handling requests for user authentication, workout logging, and data retrieval.
- **User Authentication:** Implements a secure authentication system using JSON Web Tokens (JWT) to manage user sessions and protect endpoints.
- **Workout Management:** Handles CRUD operations for workouts, allowing users to create, update, delete, and retrieve workout sessions.
- **Machine Learning Integration:** Utilizes a TensorflowJS model to generate exercise recommendations based on user data.
- **Database Interaction:** Interfaces with a MongoDB database using Prisma ORM to perform efficient data operations.

## Technology Stack

- **Node.js:** Provides the runtime environment for building server-side applications.
- **Express.js:** Framework for building robust APIs and handling HTTP requests.
- **Prisma ORM:** Manages database interactions with MongoDB, providing a type-safe and efficient querying interface.
- **JWT Authentication:** Secures API endpoints and manages user sessions using JSON Web Tokens.
- **TypeScript:** Enhances code quality with static typing, preventing type-related errors and improving maintainability.

## Architecture

The server follows an MVC-like architecture with distinct layers for routing, business logic, and database interaction. Key components include:

- **Routes:** Define the API endpoints and handle incoming requests.
- **Controllers:** Implement business logic and coordinate between routes and data layers.
- **Database:** Handles interactions with MongoDB, performing CRUD operations through Prisma ORM.

## Machine Learning Integration

The server incorporates a pre-trained TensorflowJS model to provide exercise recommendations. The model processes user data and generates insights that are sent back to the client. The integration includes:

- **Model Loading:** Loads the exported TensorflowJS model and prepares it for inference.
- **Prediction Service:** Processes input data, runs predictions, and maps outputs to user-friendly suggestions.

## Run the server
1. install packages with `npm i`
2. generate prisma client with `npx prisma generate`
3. run server locally
    - run dev server with `npm run dev`
    - build server with `npm run build`
    - run production server with `npm run start`
