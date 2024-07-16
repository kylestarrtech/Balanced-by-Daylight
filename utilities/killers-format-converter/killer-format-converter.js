const fs = require('fs');

const inputData = fs.readFileSync('Old.json', 'utf8');
const data = JSON.parse(inputData);

let newData = [];

for (let i = 0; i < data.length; i++) {
    let exampleKLRObject = {
        ID: i,
        Name: data[i],
        Portrait: "public/iconography/portraits/Trapper.webp",
        LorePortrait: "public/iconography/lore/Trapper.webp",
        PowerIcon: "public/public/Powers/Trapper.webp",
        Aliases: [],
        AdditionalData: {}
    }

    let fileName = "";
    data[i].substring(3, data[i].length).split(' ').forEach((word, index) => {
        if (index === 0) {
            fileName = word;
        } else {
            fileName += `${word}`;
        }
    });

    exampleKLRObject.Portrait = `public/iconography/portraits/${fileName}.webp`;
    exampleKLRObject.LorePortrait = `public/iconography/lore/${fileName}.webp`;
    exampleKLRObject.PowerIcon = `public/public/Powers/${fileName}.webp`;

    console.log(exampleKLRObject);
    newData.push(exampleKLRObject);
}

fs.writeFileSync('New.json', JSON.stringify(newData, null, 4), 'utf8');