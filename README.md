# PetalPal

PetalPal is an interactive web app where users can record their daily mood by planting flowers in a shared digital garden. Each flower represents an emotion, and friends can visit one another’s gardens, move around as a visitor avatar, leave supportive messages, and send support to flowers.

## Features

### Daily mood check-in
- Users can write about what happened today
- Users can choose a mood manually or let the app detect a mood from the text
- Submitting a check-in creates a flower in the user’s garden

### Flower garden visualization
- Different moods create different flower images
- Flowers appear at fixed positions in the garden
- Flower positions stay stable and do not overlap
- Users can click their own flowers to view details and manage them

### Friend interaction
- Users can add and remove friends
- Users can visit a friend’s garden
- While visiting, users can move their avatar by:
  - clicking on empty space in the garden
  - using the arrow keys
- When the visitor gets close to a flower, its information appears
- Visitors can leave a message or give support to that flower

### Visitor system
- Active visitors can be seen in the host user’s garden
- Visit records are saved so users can see who visited

## Project Idea

This project was designed as a calming, supportive social garden experience. Instead of logging emotions in a plain list, users “grow” their feelings into flowers. The garden becomes a visual diary, while friend visits add a small sense of connection and encouragement.

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express

## Project Structure

```text
project/
├── public/
│   ├── assets/                # background, flower, and decoration images
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   ├── renderGarden.js
│   ├── interactions.js
│   └── ...
├── server.js
├── package.json
└── README.md