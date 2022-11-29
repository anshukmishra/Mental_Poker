// node server which will handle socket io connections
const io = require("socket.io")(8000);
var sockets = {};

 io.on("connection", (socket) => {
    console.log(`user ${socket.id} has connected`);
    io.to(socket.id).emit("server_id", socket.id);
  
    socket.on("join_room", ({ room, name }) => {
      try {
        const count = sockets[room] ? sockets[room].names.length : 0;
        if(count<2)
        {
          socket.join(room);
          socket.nickname = name;
          socket.room = room;
          if (!sockets[room]) {
            sockets[room] = {};
            sockets[room].names = [];
            sockets[room].ids = [];
            sockets[room].start = false;
            // sockets[room].names = {name};
          }
          sockets[room].names = [...sockets[room].names, name];
          sockets[room].ids = [...sockets[room].ids, socket.id];
          io.in(room).emit("player_count", sockets[room].names.length)
          // io.in(room).emit("update", `${name} has joined room ${room}`);
          console.log(`${name} joind room ${room}`);
        }
        else
        {
          const random_room=214365879;
          socket.join(random_room);
          socket.nickname = name;
          socket.room = random_room;
          io.in(random_room).emit("stop_joining", sockets[room].names.length);
          socket.leave(random_room);
          delete socket.room;
          delete socket.nickname;
        }
      } catch (err) {
        console.log(err.message);
      }
    });
  
    socket.on("game_started", ({ room, name }) => {
      try {
        // let cards_array = ["2 of Clubs","4 of Diamonds","J of Hearts"];
        let cards_array = allocate_cards();
        console.log(socket);
        console.log(sockets[room]);
        // io.in(room).emit("receive_card", {cards : cards_array});
        io.to(sockets[room].ids[0]).emit("receive_card", {cards : cards_array[0]});
        io.to(sockets[room].ids[1]).emit("receive_card", {cards : cards_array[1]});
      } catch (err) {
        console.log(err.message);
      }
    });

    socket.on("send", ({ room, name, message }) => {
        try {
          io.in(room).emit("receive", {message: message, name: name})
          // io.in(room).emit("update", `${name} has joined room ${room}`);
          console.log(`${room}  ${name} send message : ${message}`);
        } catch (err) {
          console.log(err.message);
        }
    });

    socket.on("leave_room", ({ name, room }) => {
      try {
        socket.leave(room);
        delete socket.room;
        delete socket.nickname;
        if (sockets[room]) {
          sockets[room].ids.splice(sockets[room].names.indexOf(name), 1);
          sockets[room].names.splice(sockets[room].names.indexOf(name), 1);
          io.in(room).emit("player_count", sockets[room].names.length);
          console.log(`${name} has left ${room} `,sockets[room].names.length);
        }
      } catch (error) {
        console.log(error.message);
      }
    });
  });
  

  function allocate_cards()
  {
    function gen_deck() {
      let deck_no = [];
      for (let i = 1; i <= 52; i++) {
          deck_no.push((i + 5) ** 2);
      }
      console.log(deck_no);
      return deck_no;
    }
    
    // generate 52 card no. in ascii format (all are 4 digit first 2 digit represent house
    //and last 2 card number
    function gen_deck_by_ascii() {
        var houses = ["83", "67", "72", "68"]
        var face_card = ["65", "74", "75", "81"]
        var cards = []
        for (i = 2; i < 11; i++) {
            if (i == 10) {
                cards.push("10")
            }
            else {
                cards.push("0" + i)
            }
        }
        // cards is in string form =[02,03,04,..,10]
        for (i = 0; i < face_card.length; i++) {
            let x = face_card[i];
            cards.push(x)
        }
        // cards+=[65,74,75,81]
    
        var deck = []
        for (i = 0; i < houses.length; i++) {
            for (j = 0; j < cards.length; j++) {
                let x = houses[i]
                let y = cards[j]
                let z = x + y
                deck.push(parseInt(z))
    
            }
        }
        return deck
    }
    
    // map square card numbers to ascii card 4 digit number
    function mapping(deck) {
        let deck_ascii = gen_deck_by_ascii();
        let Mappings = {}
    
        let l = deck.length;
    
        for (let i = 0; i < l; i++) {
            Mappings[deck[i]] = deck_ascii[i];
        }
        return (Mappings);
    }
    
    // calculate (base raise to power exponent)%modulas in O(log(exponent))
    function powerMod(base, exponent, modulus) {
        if (modulus === 1) return 0;
        var result = 1;
        base = base % modulus;
        while (exponent > 0) {
            if ((exponent&1) === 1)  //odd number
                result = (result * base) % modulus;
            exponent = exponent >> 1; //divide by 2
            base = (base * base) % modulus;
        }
        return result;
    }
    
    //SRA Algorithm code start here in which both key pair private and public remain secret
    //encrypt code
    function enc_card(deck, pub_key) 
    {
        var enc_deck = []
        let [e, n] = [pub_key[0], pub_key[1]]
    
        for (i = 0; i < deck.length; i++) {
            enc_deck.push(powerMod(deck[i], e, n))
        }
        return enc_deck
    }
    
    //decrypt code
    function dec_card(deck, priv_key) {
        let dec_deck = [];
        let [d, n] = [priv_key[0], priv_key[1]];
        let l = deck.length
        for (let i = 0; i < l; i++) {
            dec_deck.push(powerMod(deck[i], d, n))
        }
        return dec_deck
    }
    
    // Returns e and d for given p and q
    function key_generator(p, q) {
        let n = p * q;
        let r = (p - 1) * (q - 1);
    
        // return gcd of e and r
        function egcd(e, r) {
            while (r != 0) {
                let x = e;
                e = r;
                r = x % r;
            }
            return e;
        }
    
        // return one of integer pair satisfying ax+by=1
        // using extended euclid algorithm
        function mult_inv(a, b) 
        {
            if (b == 0) { return ([1, 0]); }
            let [x1, y1] = mult_inv(b, a % b);
            let x = y1;
            let y = x1 - (parseInt(a / b)) * y1;
            return ([x, y]);
        }
    
        let e;
    
        var arr = [];
    
        for (i = 2; i < 10000; i++) {
            if (egcd(i, r) == 1) {
                arr.push(i);
            }
        }
        arr = shuffle_deck(arr);
        e = arr[0];
    
    
        console.log("e is")
        console.log(e)
    
        // d* e % r=1
        // d*e =1 +r*y
        // d*e-r*y=1
        // e*x-r*y=1
        //eugcd(e, r);
        //console.log(e,r);
        // [d,y]
        let d = mult_inv(e, r)[0];
        if (d < 0) {
            d = Math.abs(d);
            d = ((parseInt(d / r)) + 1) * r - d;
        }
        public = [e, n];
        private = [d, n];
        console.log(e, d, n, (e * d) % r);
    
        return [public, private];
    }
    
    
    // 8305 - 83 + 05
    // this function takes ascii no. representation of card and read it
    function read_card(card) {
        //console.log(card,typeof(card));
        card = card.toString();
        let house = parseInt(`${card[0]}${card[1]}`);
        let num = parseInt(`${card[2]}${card[3]}`);
        let houses = { 83: 'Spades', 67: 'Clubs', 72: 'Hearts', 68: 'Diamonds' }
        if (num <= 10) {
            num = num.toString();
        }
        else if (num == 65) { num = 'A'; }
        else if (num == 74) { num = 'J'; }
        else if (num == 75) { num = 'K'; }
        else if (num == 81) { num = 'Q'; }
        return (`${num} of ${houses[house]}`);
    }
    
    
    // n-1 -> floor(rand*(n-1))
    // let id=10
    // rand =0.567
    // swap id= 5.67 's floor i.e 5
    // swap 5 and 10
    function shuffle_deck(array) {
        var temporaryValue, randomIndex;
        var cnt = 1000;
        var n = array.length
    
        // While there remain elements to shuffle...
        while (0 !== cnt) {
    
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * n);
            cnt -= 1;
            // swapping between random index and n-1
            // And swap it with the current element.
            temporaryValue = array[n - 1];
            array[n - 1] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }
    
    function hand_enc(deck) 
    {
        deck = shuffle_deck(deck);
        let deck1 = [];
        var t = 3;//5;
        while (t--) {
    
            deck1.push(deck.pop());
        }
        return deck1;
    }
    
    
    function isprime(n) {
        let f = 0;
        let d = n - 1, s = 0;
        while (d) {
            if (d % 2 == 0) {
                s++;
                d /= 2;
            }
            else
                break;
        }
    
        let A = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41];
        var test = A.length;
        while (test--) {
            let a = A[test];
            if (powerMod(a, d, n) === 1) { f = 1; break; }
            var p = d;
            for (i = 0; i < s; i++) {
                if (powerMod(a, p, n) === (n - 1)) { f = 1; break; }
                p = p * 2;
            }
        }
        return f;
    }
    
    function randomNumberWithBitLength(l) {
        let st = 1;
        for (i = 0; i < (l-1); i++) {
            st = st * 2;
        }
        let x = st + Math.floor(Math.random() * st)
        //console.log(x)
        return (x);
    }
    
    function primeGen() {
        while (true) {
            let v = randomNumberWithBitLength(12);
            if (v % 2 == 0) v += 1;
            if (isprime(v)) return v;
        }
    }
    //deck is the 52 card no. all are squared number
    var deck = gen_deck();
    // map squared card numbers to ascii card 4 digit number
    let Mappings = mapping(deck);
    
    
    var cards = []
    for (i = 0; i < deck.length; i++)
        cards.push(read_card(Mappings[deck[i]]));
    
    console.log("Deck Generated")
    console.log(cards)
    
    
    console.log('Deck in integer form')
    console.log(deck)
    
    console.log("Alice generates p and q and also sends them to bob")
    
    function validprime(x) {
        for (i = 2; i * i <= x; i++) {
            if (x % i == 0) return false;
        }
        return true;
    }
    let p;
    while (true) {
        p = primeGen();
        if (validprime(p)) break;
    }
    
    let q;
    while (true) {
        q = primeGen();
        if (p != q && validprime(q)) break;
    }
    console.log(p); console.log(q);
    
    let [alice_pub, alice_priv] = key_generator(p, q)
    
    console.log('Alice public key(e,n)', alice_pub)
    console.log('Alice private key(d,n)', alice_priv)
    
    
    deck = enc_card(deck, alice_pub);
    
    console.log(deck)
    console.log('Deck shuffled')
    
    
    deck = shuffle_deck(deck)
    
    console.log('Deck encrypted and shuffled by alice')
    console.log('Alice send this encrypted and shuffled deck to Bob')
    console.log('Bob select 5 cards for alice randomly')
    
    // alice got his 5 hands but it is in encrypted form
    let alice_hand_enc_a = hand_enc(deck)
    console.log(alice_hand_enc_a)
    
    // alice decrypted his cards
    let alice_hand_dec = dec_card(alice_hand_enc_a, alice_priv)
    console.log(alice_hand_dec, "244")
    
    // bob chooses the 5 hands
    let bob_hand_enc_a = hand_enc(deck)
    console.log(bob_hand_enc_a)
    
    
    let [bob_pub, bob_priv] = key_generator(p, q)
    console.log("Bob generates p and q ")
    console.log("Bob public key", bob_pub)
    console.log("Bob private key", bob_priv)
    
    
    // bob encrypted the card and sent it to alice
    let bob_hand_enc_ab = enc_card(bob_hand_enc_a, bob_pub)
    
    // alice decrypted the card and sent it to bob
    let bob_hand_enc_b = dec_card(bob_hand_enc_ab, alice_priv)
    
    // bob decrypted the card and got his own cards
    let bob_hand_dec = dec_card(bob_hand_enc_b, bob_priv)
    console.log(bob_hand_dec)
    
    console.log("Alice's cards are")
    
    let alice_cards = [], bob_cards = []
    console.log(alice_hand_dec);
    
    for (i = 0; i < alice_hand_dec.length; i++)
        alice_cards.push(read_card(Mappings[alice_hand_dec[i]]))
    
    console.log(alice_cards)
    
    
    console.log("Bob's cards are")
    for (i = 0; i < bob_hand_dec.length; i++)
        bob_cards.push(read_card(Mappings[bob_hand_dec[i]]));
    console.log(bob_cards)
    return([alice_cards,bob_cards]);
  }