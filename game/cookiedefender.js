'use strict';
function CookieDefenderGame() {
    // TODO:
    // Clean up everything. This is all pretty quick and dirty. :)
    // Make game loop take time in to counter
    // Boss key?
    // Add music
    this.inputHandler = new InputHandler(this);
    this.renderer = new LocalStorageRenderer();
    this.updateInterval = 450;
    this.then = 0;
    this.playerName = null;
    this.playSounds = false;
    this.playMusic = false;
    var self = this;
    this.start = function () {
        this.changeState(MenuState);
    }
    this.setPlayerName = function (playerName) {
        this.playerName = playerName;
    }
    this.setPlaySounds = function (play) {
        this.playSounds = play;
        if (this.state && this.state.setPlaySounds) {
            this.state.setPlaySounds(play);
        }
    }
    this.setPlayMusic = function (play) {
        this.playMusic = play;
    }
    this.changeState = function (stateClass, extraArgs) {
        if (this.state && this.state.destroy) {
            this.state.destroy();
        }
        if (typeof extraArgs === 'undefined') {
            extraArgs = {};
        }
        extraArgs.playerName = this.playerName;
        this.state = new stateClass(this.renderer, function (stateClass, extraArgs) { self.changeState(stateClass, extraArgs) }, extraArgs);
        this.setPlaySounds(this.playSounds);
        if (this.state.create) {
            this.state.create();
        }
        this.update();
    }
    this.update = function () {
        if (this.state && this.state.update) {
            var now = Date.now();
            var elapsed = now - this.then;
            if (elapsed > this.updateInterval) {
                this.then = now - (elapsed % this.updateInterval);
                this.state.update();
            }
            window.requestAnimationFrame(function () { self.update() });
        }
    }
    this.onInput = function (action) {
        if (this.state && this.state.onInput) {
            this.state.onInput(action);
        }
    }
    this.onFocusChange = function (isFocused) {
        //console.log('isFocused', isFocused);
        if (this.state && this.state.onFocusChange) {
            this.state.onFocusChange(isFocused);
        }
    }
}
function MenuState(renderer, changeStateCallback) {
    this.renderer = renderer;
    this.changeStateCallback = changeStateCallback;

    this.create = function () {
        this.renderer.clearScreen();
        var topScore = localStorage.getItem('topScore');
        if (topScore) {
            this.renderer.drawText('LEFT', 0, 'TOP SCORE: ' + topScore);
        }
        var row = Math.round(this.renderer.getNumOfRows() / 2) - 4;
        this.renderer.drawText('CENTER', row++, '　 🍪　 COOKIE  DEFENDER　 🍪　 　 　 ');
        this.renderer.drawText('LEFT', row++, '　 The aliens are coming for all the hard-earned');
        this.renderer.drawText('LEFT', row++, '　 cookies you have consented to.');
        this.renderer.drawText('LEFT', row++, '　 Even hiding them in the local storage didn\'t help...');
        this.startRow = row += 1;
        this.startTextFocused = 'Press arrow keys or WASD to start';
        this.startText = this.startTextBlurred = 'Focus your browser window and press arrow keys or WASD to start';
        this.startTextCounter = 0;
        this.renderer.drawText('CENTER', row + 2, '　 Press \'C\' to see credits.');
    }
    this.update = function () {
        this.renderer.blinkText('CENTER', this.startRow, this.startText);
    }
    this.destroy = function () {
        console.log('destroy()');
    }
    this.onInput = function (action) {
        switch (action) {
            case 'C':
                this.changeStateCallback(CreditState);
                break;
            default:
                this.changeStateCallback(PlayState);
                break;
        }
    }
    this.onFocusChange = function (isFocused) {
        this.startText = isFocused ? this.startTextFocused : this.startTextBlurred;
        this.startTextCounter = 2;
    }
}
function CreditState(renderer, changeStateCallback) {
    this.renderer = renderer;
    this.changeStateCallback = changeStateCallback;

    this.create = function () {
        this.renderer.clearScreen();
        var row = Math.round(this.renderer.getNumOfRows() / 2) - 5;
        this.renderer.drawText('CENTER', row++, '　 🍪　 ATTRIBUTION　 🍪　 　 　 　 　 　 ');
        this.renderer.drawText('LEFT', row++, '　 The following sounds are licensed under');
        this.renderer.drawText('LEFT', row++, '　 Creative Commons Attribution');
        this.renderer.drawText('LEFT', row++, '　 3.0 Unported (CC BY 3.0):');
        this.renderer.drawText('LEFT', row++, '　  - Player shot: gunn76');
        this.renderer.drawText('LEFT', row++, '　  - Explosion: Sound Explorer');
        this.renderer.drawText('LEFT', row++, '　  - Aliens: Mike Koenig');
        this.startRow = row += 1;
        this.startText = this.startTextFocused = 'Press any key to go to the menu';
        this.startTextBlurred = 'Focus your browser window and press any key to go to the menu';
        this.startTextCounter = 0;
    }
    this.update = function () {
        this.renderer.blinkText('CENTER', this.startRow, this.startText);
    }
    this.destroy = function () {
        console.log('destroy()');
    }
    this.onInput = function (action) {
        switch (action) {
            default:
                this.changeStateCallback(MenuState);
                break;
        }
    }
    this.onFocusChange = function (isFocused) {
        this.startText = isFocused ? this.startTextFocused : this.startTextBlurred;
        this.startTextCounter = 2;
    }
}
function GameOverState(renderer, changeStateCallback, extraArgs) {
    this.renderer = renderer;
    this.changeStateCallback = changeStateCallback;
    this.wonGame = extraArgs.wonGame || false;
    this.score = extraArgs.score || '-';
    this.audio = null;
    this.playSounds = false;

    this.create = function () {
        this.renderer.clearScreen();
        var row = Math.round(this.renderer.getNumOfRows() / 2) - 4;
        if (this.wonGame) {
            this.renderer.drawText('CENTER', row++, '👩‍💻 YOU WON 🍪');
            this.renderer.drawText('LEFT', row++, '　 Amazing work. You and what\'s left of your cookies are safe.');
        } else {
            this.renderer.drawText('CENTER', row++, '👾 GAME OVER 👾');
            this.renderer.drawText('CENTER', row++, '　 　 　 The aliens got you and your cookies.');
            if (this.playSounds) {
                this.audio = new Audio('./game_lost.mp3');
                this.audio.load();
                this.audio.volume = 0.2;
                this.audio.play();
            }
        }
        row++;
        this.renderer.drawText('CENTER', row++, 'Score: ' + this.score);
        var topScore = localStorage.getItem('topScore');
        if (topScore) {
            if (this.score > topScore) {
                this.renderer.drawText('CENTER', row++, 'New top score!');
                localStorage.setItem('topScore', this.score);
            } else {
                this.renderer.drawText('CENTER', row++, 'Top score: ' + topScore);
            }
        } else { // No top score registered
            localStorage.setItem('topScore', this.score);
        }
        this.startRow = row += 2;
        this.startText = this.startTextFocused = 'Press arrow keys or WASD to play again';
        this.startTextBlurred = 'Focus your browser window and press arrow keys or WASD to play again';
    }
    this.update = function () {
        this.renderer.blinkText('CENTER', this.startRow, this.startText);
    }
    this.destroy = function () {
        console.log('destroy()');
        if (this.audio != null) {
            this.audio.pause();
            this.audio = null;
        }
    }
    this.setPlaySounds = function (play) {
        this.playSounds = play;
    }
    this.onInput = function (action) {
        this.changeStateCallback(PlayState);
    }
    this.onFocusChange = function (isFocused) {
        this.startText = isFocused ? this.startTextFocused : this.startTextBlurred;
        this.startTextCounter = 2;
    }
}
function PlayState(renderer, changeStateCallback, extraArgs) {
    this.renderer = renderer;
    this.changeStateCallback = changeStateCallback;
    this.level = (extraArgs && extraArgs.level) || 1;
    this.numOfLifes = extraArgs && extraArgs.numOfLifes >= 0 ? extraArgs.numOfLifes : 3;
    this.score = (extraArgs && extraArgs.score) || 0;
    this.playerName = (extraArgs && extraArgs.playerName) || null;
    this.player = new Player(this.renderer.getNumOfCols() - 1, Math.round(this.renderer.getNumOfCols() / 2), this.renderer.getNumOfRows() - 2);
    this.alienBombGroup = new AlienBombGroup(this.renderer.getNumOfRows());
    this.alienGroup = new AlienGroup(10, this.level, this.renderer.getNumOfCols(), this.alienBombGroup);
    this.explosionGroup = new ExplosionGroup();
    this.playerBulletGroup = new PlayerBulletGroup(1);
    this.cookieGroup = new CookieGroup(10 + this.level, (this.renderer.getNumOfCols() - 10 - this.level) / 2, this.renderer.getNumOfRows() - 1);
    this.isPaused = false;
    this.isFocused = true;
    this.playSounds = false;

    this.create = function () {
        if (this.playSounds) {
            var audio = new Audio('./alien_start.m4a');
            audio.volume = 0.05;
            audio.play();
        }
        this.renderer.clearScreen();
    }
    this.update = function () {
        if (this.isPaused) {
            var row = Math.round(this.renderer.getNumOfRows() / 2) - 4;
            this.renderer.blinkText('CENTER', row++, 'PAUSED');
            if (this.isFocused) {
                this.renderer.drawText('CENTER', row++, 'Press any key to continue');
            } else {
                this.renderer.drawText('CENTER', row++, 'Focus browser window and press any key to continue game');
            }
            return;
        }
        //
        // Update positions
        //
        this.player.update();
        this.alienGroup.update();
        if (this.player.fire()) {
            if (this.playSounds) {
                this.player.playSound();
            }
            this.playerBulletGroup.add(this.player.position.x, this.player.position.y);
            this.score = Math.max(this.score - 1, 0);
        }
        this.playerBulletGroup.update();
        this.alienBombGroup.update();
        this.explosionGroup.update();
        //
        // Collision checking
        //
        // Aliens
        var alive = this.alienGroup.alive;
        var isAliensAlive = false;
        for (var row = 0; row < alive.length; row++) {
            var screenRow = this.alienGroup.position.y + row;
            if (screenRow >= this.renderer.getNumOfRows() - 1) { // Aliens reached bottom of screen
                this.changeStateCallback(GameOverState); // TODO: Umm..this doesn't work if every aliens on the first row is gone, right?
                return;
            }
            for (var col = 0; col < alive[row].length; col++) {
                if (alive[row][col]) {
                    isAliensAlive = true;
                    var alienX = Math.round(this.alienGroup.position.x) + col;
                    if (screenRow == this.player.position.y) {
                        if (alienX == this.player.position.x) { // Alien hit player
                            if (this.playSounds) {
                                this.explosionGroup.playSound();
                            }
                            this.changeStateCallback(GameOverState, { score: this.score });
                            return;
                        }
                    } else {
                        var bullets = this.playerBulletGroup.getBulletPositions();
                        for (var i = 0; i < bullets.length; i++) {
                            var bulletY = Math.round(bullets[i].y);
                            if (screenRow == bulletY && bullets[i].x == alienX) {
                                if (this.playSounds) {
                                    this.explosionGroup.playSound();
                                }
                                bullets[i].alive = false;
                                alive[row][col] = false;
                                this.score += 10;
                                this.explosionGroup.add(alienX, screenRow);
                            }
                        }
                    }
                }
            }
        }
        if (!isAliensAlive) {
            this.score += 100;
            if (this.level >= 10) {
                this.changeStateCallback(GameOverState, { wonGame: true, score: this.score });
            } else {
                this.changeStateCallback(PlayState, { level: this.level + 1, score: this.score, numOfLifes: this.numOfLifes });
            }
            return;
        }
        // Bombs
        var bombs = this.alienBombGroup.getBombPositions();
        for (var i = 0; i < bombs.length; i++) {
            var bombX = Math.round(bombs[i].x);
            var bombY = Math.round(bombs[i].y);
            if (bombX == Math.round(this.player.position.x) && bombY == Math.round(this.player.position.y)) {
                if (this.playSounds) {
                    this.explosionGroup.playSound();
                }
                bombs[i].alive = false;
                this.numOfLifes--;
                this.explosionGroup.add(bombX, bombY);
                if (this.numOfLifes < 0) {
                    this.changeStateCallback(GameOverState, { score: this.score });
                    return;
                }
            } else {
                var cookies = this.cookieGroup.alive;
                var isCookiesAlive = false;
                for (var j = 0; j < cookies.length; j++) {
                    isCookiesAlive = isCookiesAlive || cookies[j].alive;
                    if (cookies[j].alive && cookies[j].y == bombY && Math.round(cookies[j].x) == bombX) {
                        if (this.playSounds) {
                            this.explosionGroup.playSound();
                        }
                        cookies[j].alive = false;
                        this.score = Math.max(this.score - 15, 0);
                        this.explosionGroup.add(bombX, bombY);
                    }
                }
                if (!isCookiesAlive) {
                    this.changeStateCallback(GameOverState, { score: this.score });
                    return;
                }
            }
        }
        //
        // Draw
        //
        var screenBuffer = new Array(this.renderer.getNumOfRows());
        // Status bar
        screenBuffer[0] = (this.playerName ? 'PLAYER: ' + this.playerName + this.renderer.getSpace() + '/' + this.renderer.getSpace() : '') + 'WAVE: ' + this.level + '/10' + this.renderer.getSpace() + '/' + this.renderer.getSpace() + 'LIVES: ' + (this.numOfLifes > 0 ? this.player.getEmoji().repeat(this.numOfLifes) : '-') + this.renderer.getSpace() + '/' + this.renderer.getSpace() + 'SCORE: ' + this.score;
        // Cookies
        var alive = this.cookieGroup.alive;
        for (var i = 0; i < alive.length; i++) {
            var screenRow = alive[i].y;
            if (screenBuffer[screenRow] == null) {
                screenBuffer[screenRow] = new Array(this.renderer.getNumOfCols());
            }
            screenBuffer[screenRow][Math.round(alive[i].x)] = alive[i].alive ? this.cookieGroup.getEmoji() : this.renderer.getSpace();
        }
        // Aliens
        var alive = this.alienGroup.alive;
        for (var row = 0; row < alive.length; row++) {
            var screenRow = this.alienGroup.position.y + row;
            if (screenBuffer[screenRow] == null) {
                screenBuffer[screenRow] = new Array(this.renderer.getNumOfCols());
            }
            for (var col = 0; col < alive[row].length; col++) {
                screenBuffer[screenRow][Math.round(this.alienGroup.position.x) + col] = alive[row][col] ? this.alienGroup.getEmoji() : this.renderer.getSpace();
            }
        }
        // Player bullets
        var bullets = this.playerBulletGroup.getBulletPositions();
        for (var i = 0; i < bullets.length; i++) {
            var screenRow = Math.round(bullets[i].y);
            if (screenBuffer[screenRow] == null) {
                screenBuffer[screenRow] = new Array(this.renderer.getNumOfCols());
            }
            screenBuffer[screenRow][Math.round(bullets[i].x)] = this.playerBulletGroup.getEmoji();
        }
        // Alien bombs
        var bombs = this.alienBombGroup.getBombPositions();
        for (var i = 0; i < bombs.length; i++) {
            var bombX = Math.round(bombs[i].x);
            var bombY = Math.round(bombs[i].y);
            if (screenBuffer[bombY] == null) {
                screenBuffer[bombY] = new Array(this.renderer.getNumOfCols());
            }
            screenBuffer[bombY][bombX] = this.alienBombGroup.getEmoji();
        }
        // Player
        var screenRow = Math.round(this.player.position.y);
        if (screenBuffer[screenRow] == null) {
            screenBuffer[screenRow] = new Array(this.renderer.getNumOfCols());
        }
        screenBuffer[screenRow][Math.round(this.player.position.x)] = this.player.getEmoji();
        // Explosions
        var explosions = this.explosionGroup.getExplosionPositions();
        for (var i = 0; i < explosions.length; i++) {
            explosions[i].y;
            if (screenBuffer[explosions[i].y] == null) {
                screenBuffer[explosions[i].y] = new Array(this.renderer.getNumOfCols());
            }
            screenBuffer[explosions[i].y][explosions[i].x] = this.explosionGroup.getEmoji();
        }
        // Render command
        this.renderer.drawArray(screenBuffer);
    }
    this.setPlaySounds = function (play) {
        this.playSounds = play;
    }
    this.onInput = function (action) {
        //console.log(action);
        switch (action) {
            case 'LEFT':
                this.player.velocity.x = -1;//this.player.velocity.x < 0 ? 0 : -1;
                break;
            case 'RIGHT':
                this.player.velocity.x = 1;//this.player.velocity.x > 0 ? 0 : 1;
                break;
            case 'SPACE':
            case 'UP':
                this.player.isFiring = true;
                break;
            case 'PAUSE':
            case 'P':
                if (!this.isPaused) {
                    this.isPaused = true;
                    return;
                }
        }
        this.isPaused = false;
    }
    this.onFocusChange = function (isFocused) {
        if (!isFocused) {
            this.isPaused = true;
        }
        this.isFocused = isFocused;
    }
}
function Player(maxX, x, y) {
    this.maxX = maxX;
    this.position = {};
    this.position.x = x;
    this.position.y = y;
    this.velocity = {};
    this.velocity.x = 0;
    this.lastShot = 0;
    this.isFiring = false;
    this.sounds = [];
    var sound = new Audio('./player_shot.m4a');
    sound.load();
    sound.volume = 0.03;
    this.sounds[0] = sound.cloneNode(true);
    this.sounds[0].volume = 0.03; // For some reason it seems like we need to set the volume after every clone
    this.sounds[1] = sound.cloneNode(true);
    this.sounds[1].volume = 0.035;
    this.sounds[2] = sound.cloneNode(true);
    this.sounds[2].volume = 0.03;
    this.sounds[3] = sound.cloneNode(true);
    this.sounds[3].volume = 0.035;
    this.soundCounter = 0;

    this.getEmoji = function () {
        return '👩‍💻';
    }
    this.fire = function () {
        if (this.isFiring) {
            if (Date.now() - this.lastShot >= 440) {
                this.lastShot = Date.now();
                this.isFiring = false;
                return true;
            }
        }
        return false;
    }
    this.update = function () {
        if (this.velocity.x < 0 && this.position.x > 0) {
            this.position.x -= 1;
            if (this.position.x < 0) {
                this.position.x = 0;
            }
        } else if (this.velocity.x > 0 && this.position.x < this.maxX) {
            this.position.x += 1;
            if (this.position.x > this.maxX) {
                this.position.x = this.maxX;
            }
        }
    }
    this.playSound = function () {
        this.sounds[this.soundCounter++ % this.sounds.length].play();
    }
}
function AlienGroup(cols, rows, maxX, alienBombGroup) {
    this.cols = cols;
    this.rows = rows;
    this.maxX = maxX - cols;
    this.alienBombGroup = alienBombGroup;
    this.position = {};
    this.position.x = Math.round(maxX / 4);
    this.position.y = 2;
    this.velocity = {};
    this.velocity.x = 1;
    this.alive = [];
    this.tickCounter = 0;
    for (var row = 0; row < rows; row++) {
        this.alive.push([]);
        for (var col = 0; col < cols; col++) {
            this.alive[row].push(true);
        }
    }
    this.getEmoji = function () {
        return '👾';
    }
    this.update = function () {
        if (this.velocity.x < 0) {
            if (this.position.x > 0) {
                this.position.x -= 0.5;
                if (this.position.x < 0) {
                    this.position.x = 0;
                }
            } else {
                this.position.y++;
                this.position.x = 0;
                this.velocity.x = 1;
            }
        } else if (this.velocity.x > 0) {
            if (this.position.x < this.maxX) {
                this.position.x += 0.5;
                if (this.position.x > this.maxX) {
                    this.position.x = this.maxX;
                }
            } else {
                this.position.y++;
                this.position.x = this.maxX;
                this.velocity.x = -1;
            }
        }
        if (++this.tickCounter % 3 === 0) {
            var alienPosition = this.getAlienShooterPosition();
            if (alienPosition != null) {
                this.alienBombGroup.add(alienPosition.x, alienPosition.y);
            }
        }
    }
    this.getAlienShooterPosition = function () {
        for (var row = this.rows - 1; row >= 0; row--) {
            var randomCol = Math.floor(Math.random() * this.cols);
            var randomAlien = this.alive[row][randomCol];
            if (randomAlien) {
                return { x: this.position.x + randomCol, y: this.position.y + row };
            }
            for (var col = this.cols - 1; col >= 0; col--) {
                if (this.alive[row][col]) {
                    return { x: this.position.x + col, y: this.position.y + row };
                }
            }
        }
        return null;
    }
}
function ExplosionGroup() {
    this.explosions = [];
    this.sounds = [];
    var sound = new Audio('./explosion.m4a');
    sound.load();
    this.sounds[0] = sound.cloneNode(true);
    this.sounds[0].volume = 0.05;
    this.sounds[1] = sound.cloneNode(true);
    this.sounds[1].volume = 0.03;
    this.sounds[2] = sound.cloneNode(true);
    this.sounds[2].volume = 0.05;
    this.sounds[3] = sound.cloneNode(true);
    this.sounds[3].volume = 0.03;
    this.soundCounter = 0;

    this.getEmoji = function () {
        return '💥';
    }
    this.getExplosionPositions = function () {
        return this.explosions;
    }
    this.add = function (x, y) {
        //console.log(x, y);
        this.explosions.push({ x: x, y: y });
    }
    this.update = function () {
        if (this.explosions.length > 0) {
            this.explosions = [];
        }
    }
    this.playSound = function () {
        //console.log((this.soundCounter + 1) % 3);
        this.sounds[this.soundCounter++ % this.sounds.length].play();
    }
}
function PlayerBulletGroup(minY) {
    this.minY = minY;
    this.bullets = [];

    this.getEmoji = function () {
        return '🔺';
    }
    this.getBulletPositions = function () {
        return this.bullets;
    }
    this.add = function (x, y) {
        //console.log(x, y);
        this.bullets.push({ x: x, y: y, alive: true });
    }
    this.update = function () {
        for (var i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].y -= 1;
            if (!this.bullets[i].alive || this.bullets[i].y < this.minY) {
                this.bullets.splice(i, 1);
            }
        }
    }
}
function AlienBombGroup(maxY) {
    this.maxY = maxY;
    this.bombs = [];

    this.getEmoji = function () {
        return '💣';
    }
    this.getBombPositions = function () {
        return this.bombs;
    }
    this.add = function (x, y) {
        //console.log(x, y);
        this.bombs.push({ x: x, y: y, alive: true });
    }
    this.update = function () {
        for (var i = this.bombs.length - 1; i >= 0; i--) {
            this.bombs[i].y += 1;
            if (!this.bombs[i].alive || this.bombs[i].y >= this.maxY) {
                //console.log(this.bombs);
                this.bombs.splice(i, 1);
                //console.log(this.bombs);
            }
        }
    }
}
function CookieGroup(numOfCookies, x, y) {
    this.alive = [];
    for (var i = 0; i < numOfCookies; i++) {
        this.alive.push({ x: x + i, y: y, alive: true });
    }

    this.getEmoji = function () {
        return '🍪';
    }
}
function LocalStorageRenderer() {
    this.COLS = 40;
    this.ROWS = 16;
    this.getSpace = function () {
        return "　 ";//"　"//" ";
    }
    this.getNumOfRows = function () {
        return this.ROWS;
    }
    this.getNumOfCols = function () {
        return this.COLS;
    }
    this.clearScreen = function () {
        for (var i = 0; i < this.ROWS; i++) {
            localStorage.setItem((i + '').padStart(2, '0'), ' ');
        }
    }
    this.drawArray = function (array) {
        var tempStr1;
        var tempStr2;
        for (var row = 0; row < array.length; row++) {
            if (row < 0 || row >= this.ROWS) { // Out of bounds
                return;
            }
            var key = (row + '').padStart(2, '0');
            tempStr1 = localStorage.getItem(key);
            if (array[row]) {
                if (typeof array[row] === 'string') {
                    tempStr2 = array[row];
                } else {
                    tempStr2 = '';//'|';
                    for (var col = 0; col < this.COLS; col++) {
                        tempStr2 += array[row][col] || this.getSpace();
                    }
                    //tempStr2 += '|'
                }
            } else {
                tempStr2 = ' ';
            }
            if (tempStr1 != tempStr2) {
                localStorage.setItem(key, tempStr2);
            }
        }
    }
    this.drawText = function (alignment, row, text, replaceOldText) {
        if (row < 0 || row > this.ROWS) { // Out of bounds
            return;
        }
        var key = (row + '').padStart(2, '0');
        switch (alignment) {
            case 'LEFT':
                var oldValue = localStorage.getItem(key);
                if (!replaceOldText && oldValue && oldValue != ' ' && oldValue.length > text.length) {
                    text = text + oldValue.substr(text.length);
                }
                localStorage.setItem(key, text);
                break;
            case 'RIGHT':
                var oldValue = localStorage.getItem(key);
                if (!replaceOldText && oldValue && oldValue != ' ') {
                    if (oldValue.length + text.length > this.COLS) {
                        oldValue = oldValue.substr(this.COLS - (oldValue.length + text.length));
                    } else {
                        text = text.padStart(this.COLS - oldValue.length, this.getSpace());
                    }
                    text = oldValue + text;
                } else {
                    text = text.padStart(this.COLS, this.getSpace());
                }
                localStorage.setItem(key, text);
                break;
            case 'CENTER':
            default:
                // TODO: support oldValue stuff
                //console.log(text);
                var paddingStart = Math.round((this.COLS + text.length) / 2);
                localStorage.setItem(key, text.padStart(paddingStart, this.getSpace()));
                break;
        }
    }
    this.blinkText = function (alignment, row, text) {
        if (new Date().getMilliseconds() < 620) {
            this.drawText(alignment, row, text);
        } else {
            this.drawText(alignment, row, text.replace(text, ''));
        }
    }
}
function InputHandler(callbackObj) {
    // https://hacks.mozilla.org/2017/03/internationalize-your-keyboard-controls/
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
    window.addEventListener('keydown', function (e) {
        if (e.defaultPrevented) {
            return;
        }
        // We don't want to mess with the browser's shortcuts
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
            return;
        }
        //console.log(e.code || e.key || e.keyCode);
        // We try to use `code` first because that's the layout-independent property.
        // Then we use `key` because some browsers, notably Internet Explorer and
        // Edge, support it but not `code`. Then we use `keyCode` to support older
        // browsers like Safari, older Internet Explorer and older Chrome.
        switch (e.code || e.key || e.keyCode) {
            case 'KeyW': // This is 'W' on QWERTY keyboards, but 'Z' on AZERTY keyboards
            case 'KeyI':
            case 'ArrowUp':
            case 'Numpad8':
            case 38: // keyCode for arrow up
                callbackObj.onInput('UP');
                break;
            case 'KeyA':
            case 'KeyJ':
            case 'ArrowLeft':
            case 'Numpad4':
            case 37:
                callbackObj.onInput('LEFT');
                break;
            case 'KeyD':
            case 'KeyL':
            case 'ArrowRight':
            case 'Numpad6':
            case 39:
                callbackObj.onInput('RIGHT');
                break;
            case 'KeyS': // This is 'W' on QWERTY keyboards, but 'Z' on AZERTY keyboards
            case 'KeyK':
            case 'ArrowDown':
            case 'Numpad5':
            case 40:
                callbackObj.onInput('DOWN');
                break;
            case 'Space':
                callbackObj.onInput('SPACE');
                break;
            case 67:
            case 'KeyC':
                callbackObj.onInput('C');
                break;
            case 80:
            case 'KeyP':
                callbackObj.onInput('P');
                break;
            case 19:
                callbackObj.onInput('PAUSE');
                break;
        }
        e.preventDefault();
    });
    window.addEventListener('focus', function (event) {
        callbackObj.onFocusChange(true);
    }, false);
    window.addEventListener('blur', function (event) {
        callbackObj.onFocusChange(false);
    }, false);
}

// Just some polyfill for old browsers
if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}
if (!String.prototype.repeat) {
    String.prototype.repeat = function (count) {
        'use strict';
        if (this == null) {
            throw new TypeError('can\'t convert ' + this + ' to object');
        }
        var str = '' + this;
        // To convert string to integer.
        count = +count;
        if (count != count) {
            count = 0;
        }
        if (count < 0) {
            throw new RangeError('repeat count must be non-negative');
        }
        if (count == Infinity) {
            throw new RangeError('repeat count must be less than infinity');
        }
        count = Math.floor(count);
        if (str.length == 0 || count == 0) {
            return '';
        }
        // Ensuring count is a 31-bit integer allows us to heavily optimize the
        // main part. But anyway, most current (August 2014) browsers can't handle
        // strings 1 << 28 chars or longer, so:
        if (str.length * count >= 1 << 28) {
            throw new RangeError('repeat count must not overflow maximum string size');
        }
        var maxCount = str.length * count;
        count = Math.floor(Math.log(count) / Math.log(2));
        while (count) {
            str += str;
            count--;
        }
        str += str.substring(0, maxCount - str.length);
        return str;
    }
}
