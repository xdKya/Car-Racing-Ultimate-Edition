class Game {
  constructor() {
    this.resetTitle = createElement("h2");
    this.resetButton = createButton("");

    this.leaderBoard = createElement("h2");
    this.leader1 = createElement("h2");
    this.leader2 = createElement("h2");

    this.isMoving = false;
    this.direita = false;
    this.taVivo = true;
  }

  getState() {
    var gameStateRef = database.ref("gameState");
    gameStateRef.on("value", function (data) {
      gameState = data.val();
    });
  }
  update(state) {
    database.ref("/").update({
      gameState: state,
    });
  }

  start() {
    player = new Player();
    playerCount = player.getCount();

    form = new Form();
    form.display();

    car1 = createSprite(width / 2 - 50, height - 100);
    car1.addImage("carro1", car1_img);
    car1.addImage("boom", boom);
    car1.scale = 0.07;

    car2 = createSprite(width / 2 + 100, height - 100);
    car2.addImage("carro2", car2_img);
    car2.addImage("boom", boom);
    car2.scale = 0.07;

    cars = [car1, car2];

    // C38 AP
    fuels = new Group();
    powerCoins = new Group();
    obstacles = new Group();

    var obstaclesPositions = [
      { x: width / 2 + 250, y: height - 800, image: obstacle2Image },
      { x: width / 2 - 150, y: height - 1300, image: obstacle1Image },
      { x: width / 2 + 250, y: height - 1800, image: obstacle1Image },
      { x: width / 2 - 180, y: height - 2300, image: obstacle2Image },
      { x: width / 2, y: height - 2800, image: obstacle2Image },
      { x: width / 2 - 180, y: height - 3300, image: obstacle1Image },
      { x: width / 2 + 180, y: height - 3300, image: obstacle2Image },
      { x: width / 2 + 250, y: height - 3800, image: obstacle2Image },
      { x: width / 2 - 150, y: height - 4300, image: obstacle1Image },
      { x: width / 2 + 250, y: height - 4800, image: obstacle2Image },
      { x: width / 2, y: height - 5300, image: obstacle1Image },
      { x: width / 2 - 180, y: height - 5500, image: obstacle2Image },
    ];
    // obstaclesPositions.length

    // Adicione o sprite de combustível ao jogo
    this.addSprites(fuels, 4, fuelImage, 0.02);

    // Adicione o sprite de moeda ao jogo
    this.addSprites(powerCoins, 18, powerCoinImage, 0.09);

    this.addSprites(
      obstacles,
      obstaclesPositions.length,
      obstacle1Image,
      0.04,
      obstaclesPositions
    );
  }

  // C38 AP
  addSprites(spriteGroup, numberOfSprites, spriteImage, scale, positions = []) {
    for (var i = 0; i < numberOfSprites; i++) {
      var x, y;

      if (positions.length > 0) {
        x = positions[i].x;
        y = positions[i].y;
        spriteImage = positions[i].image;
      } else {
        x = random(width / 2 + 150, width / 2 - 150);
        y = random(-height * 4.5, height - 400);
      }

      var sprite = createSprite(x, y);
      sprite.addImage("sprite", spriteImage);

      sprite.scale = scale;
      spriteGroup.add(sprite);
    }
  }

  handleElements() {
    form.hide();
    form.titleImg.position(40, 50);
    form.titleImg.class("gameTitleAfterEffect");

    this.resetTitle.html("Reiniciar");
    this.resetTitle.class("resetText");
    this.resetTitle.position(width / 2 + 200, 50);

    this.resetButton.class("resetButton");
    this.resetButton.position(width / 2 + 225, 100);

    this.leaderBoard.html("Placar");
    this.leaderBoard.position(width / 3 - 50, 50);
    this.leaderBoard.class("resetText");

    this.leader1.position(width / 3 - 50, 80);
    this.leader1.class("leadersText");

    this.leader2.position(width / 3 - 50, 130);
    this.leader2.class("leadersText");
  }

  play() {
    this.handleElements();
    this.Resetar();

    Player.getPlayersInfo();
    player.getCarsAtEnd();

    if (allPlayers !== undefined) {
      image(track, 0, -height * 5, width, height * 6);

      this.showLeaderBoard();
      this.showFuelBar();
      this.showLife();

      //índice da matriz
      var index = 0;
      for (var plr in allPlayers) {
        //adicione 1 ao índice para cada loop
        index = index + 1;

        //use os dados do banco de dados para exibir os carros nas direções x e y
        var x = allPlayers[plr].positionX;
        var y = height - allPlayers[plr].positionY;

        cars[index - 1].position.x = x;
        cars[index - 1].position.y = y;

        var life = allPlayers[plr].life;
        if (life <= 0) {
          cars[index - 1].changeImage("boom");
          cars[index - 1].scale = 1;
        }

        // C38  AA
        if (index === player.index) {
          stroke(10);
          fill("red");
          ellipse(x, y, 60, 60);

          this.handleFuel(index);
          this.handlePowerCoins(index);
          this.collision(index);
          this.carCollision(index);

          // Altere a posição da câmera na direção y
          //camera.position.x = cars[index - 1].position.x;
          camera.position.y = cars[index - 1].position.y;

          if (player.life <= 0) {
            this.isMoving = false;
            this.taVivo = false;
            setTimeout(() => {
              gameState = 2;
              this.gameOver();
            }, 1000);
          }
        }
      }

      // manipulação dos eventos do teclado
      if (this.taVivo) {
        if (keyIsDown(UP_ARROW)) {
          player.positionY += 10;
          player.update();
          this.isMoving = true;
        }
        if (keyIsDown(RIGHT_ARROW) && player.positionX < width / 2 + 300) {
          player.positionX += 5;
          player.update();
          console.log(player.positionX);
          this.direita = true;
        }
        if (keyIsDown(LEFT_ARROW) && player.positionX > width / 3 - 50) {
          player.positionX -= 5;
          player.update();
          this.direita = false;
        }
      }

      const chegada = height * 6 - 100;

      if (player.positionY > chegada) {
        gameState = 2;
        player.rank += 1;
        Player.updateCarsAtEnd(player.rank);
        player.update();
        this.showRank();
      }

      if (this.isMoving) {
        player.positionY += 5;
        player.update();
      }

      drawSprites();
    }
  }

  handleFuel(index) {
    // Adicione o combustível
    if (player.score >= 10) {
      cars[index - 1].overlap(fuels, function (collector, collected) {
        player.fuel = 200;
        player.score -= 10;

        //collected (coletado) é o sprite no grupo de colecionáveis que desencadeia
        //o evento
        collected.remove();
      });
    }

    if (player.fuel > 0 && this.isMoving) {
      player.fuel -= 0.7;
    }
    if (player.fuel <= 0) {
      gameState = 2;
      this.gameOver();
    }
  }

  handlePowerCoins(index) {
    cars[index - 1].overlap(powerCoins, function (collector, collected) {
      player.score += 5;
      player.update();
      //collected (coletado) é o sprite no grupo de colecionáveis que desencadeia
      //o evento
      collected.remove();
    });
  }

  Resetar() {
    this.resetButton.mousePressed(() => {
      database.ref("/").set({
        gameState: 0,
        playerCount: 0,
        players: {},
        carsAtEnd: 0,
      });
      //att a pagina do jogo
      location.reload();
    });
  }

  showLeaderBoard() {
    var leader1, leader2;
    var players = Object.values(allPlayers);

    // a etiqueta "&emsp;" cria 4 espaços vazios no texto

    if (
      (players[0].rank === 0 && players[1].rank === 0) ||
      players[0].rank === 1
    ) {
      leader1 =
        players[0].rank +
        "&emsp;" +
        players[0].name +
        "&emsp;" +
        players[0].score;
      leader2 =
        players[1].rank +
        "&emsp;" +
        players[1].name +
        "&emsp;" +
        players[1].score;
    }

    if (players[1].rank === 1) {
      leader1 =
        players[1].rank +
        "&emsp;" +
        players[1].name +
        "&emsp;" +
        players[1].score;
      leader2 =
        players[0].rank +
        "&emsp;" +
        players[0].name +
        "&emsp;" +
        players[0].score;
    }

    this.leader1.html(leader1);
    this.leader2.html(leader2);
  }

  showRank() {
    swal({
      title: `Incrível!${"\n"}${player.rank}º Lugar! `,
      text: "Você alcançou a linha de chegada com sucesso",
      imageUrl:
        "https://raw.githubusercontent.com/vishalgaddam873/p5-multiplayer-car-race-game/master/assets/cup.png",
      imageSize: "100x100",
      confirmButtonText: "Ok",
    });
  }
  gameOver() {
    swal({
      title: `Fim de Jogo`,
      text: "VOCÊ FOI DE AMERICANAS",
      imageUrl:
        "https://cdn.shopify.com/s/files/1/1061/1924/products/Thumbs_Down_Sign_Emoji_Icon_ios10_grande.png",
      imageSize: "100x100",
      confirmButtonText: "Obrigado por jogar",
    });
  }

  showLife() {
    push();
    image(lifeImage, width / 2 - 130, height - player.positionY - 350, 20, 20);
    fill("black");
    rect(width / 2 - 100, height - player.positionY - 350, 200, 20);
    fill("#f50057");
    rect(width / 2 - 100, height - player.positionY - 350, player.life, 20);
    //noStroke();
    pop();
  }

  showFuelBar() {
    push();
    //noStroke();
    image(fuelImage, width / 2 - 130, height - player.positionY - 300, 20, 20);
    fill("black");
    rect(width / 2 - 100, height - player.positionY - 300, 200, 20);

    fill("#ffc400");
    rect(width / 2 - 100, height - player.positionY - 300, player.fuel, 20);
    pop();
  }

  collision(index) {
    if (cars[index - 1].collide(obstacles)) {
      if (player.life > 0) {
        player.life -= 50;
      }

      if (this.direita) {
        player.positionX -= 100;
      } else {
        player.positionX += 100;
      }

      player.update();
    }
  }
  carCollision(index) {
    if (index === 1) {
      if (cars[index - 1].collide(cars[1])) {
        if (player.life > 0) {
          player.life -= 50;
        }

        if (this.direita) {
          player.positionX -= 100;
        } else {
          player.positionX += 100;
        }

        player.update();
      }
    }
    if (index === 2) {
      if (cars[index - 1].collide(cars[0])) {
        if (player.life > 0) {
          player.life -= 50;
        }

        if (this.direita) {
          player.positionX -= 100;
        } else {
          player.positionX += 100;
        }

        player.update();
      }
    }
  }
}
