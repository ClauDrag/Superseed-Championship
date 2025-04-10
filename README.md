# Superseed Tennis Cup

A tennis game with authentic scoring and realistic gameplay where you can select 2-6 players from a roster of 10 players to play matches.

## How to Play

1. Open `index.html` in your web browser to start the game.
2. Select between 2-6 players from the available 10 player options by clicking on their profiles.
3. Once at least 2 players are selected, the "Start Tournament" button will become active.
4. Click "Start Tournament" to begin the tennis match.
5. The first player (Player A) starts serving. Press SPACE to serve.
6. Control the left paddle (Player A) using the 'W' and 'S' keys.
7. Control the right paddle (Player B) using the arrow up and down keys.
8. Win the match by being the first to win 2 sets (best of 3).
9. Click "Reset Game" to return to the player selection screen.

## Tennis Gameplay Rules

- Press SPACE to serve when the ball is positioned next to your paddle
- The ball must be properly exchanged between players for a point to count
- The winning player always serves after scoring a point
- Points are only counted when the opponent fails to return the ball
- The ball direction and speed change based on where it hits the paddle
- The crowd cheers when a player scores a point

## Tennis Scoring Rules

- Points: 0 → 15 → 30 → 40 → Game
- If both players reach 40 points, it's "Deuce"
- From Deuce, a player must win two consecutive points to win the game
  - First point after Deuce gives the player "Advantage"
  - If a player with Advantage wins the next point, they win the game
  - If a player with Advantage loses the next point, the score returns to Deuce
- Games: First to win 6 games with at least a 2-game lead wins the set
- Sets: First to win 2 sets wins the match

## Features

- Player roster of 10 unique characters to choose from
- Player selection system that allows choosing between 2-6 players
- Custom uploaded player images for David, Nick, Aura, João and Adam (and RoboHash API for other players)
- Minimalist oval/X design as the game's background
- Modern visual interface with player avatars displayed during gameplay
- Spectator stands with animated crowd that cheers when players score points
- Sound effects for crowd cheering
- Player profile cards showing names and scores during the match
- Authentic tennis gameplay mechanics:
  - Serving system with spacebar control
  - Ball exchange requirement for valid points
  - Winner serves next point
  - Angle and speed variation based on paddle hit position
- Traditional tennis scoring system (points, games, sets)
- Alternating service after each game
- Real-time removal and addition of players to your selection
- Simple tennis gameplay with keyboard controls

## Game Controls

- Player A (Blue, Left paddle): 
  - 'W' key to move UP
  - 'S' key to move DOWN
- Player B (Red, Right paddle):
  - Up arrow key to move UP
  - Down arrow key to move DOWN
- Serve:
  - SPACE key to serve when ready

Note: Make sure the game window is in focus for keyboard controls to work.

Enjoy the game! 
