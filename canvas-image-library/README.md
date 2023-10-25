# Why is there a separate area for Images used by the Canvas?

Short answer: node-canvas is fucking dogshit

Long answer: Yeah so it doesn't support webp. I could totally do some bullshit where I take the server one, convert it to a buffer via Sharp, then load that - but I cba and it's only here just to get the damn canvas stuff working.

So in the meantime we get this separate library shit - enjoy!