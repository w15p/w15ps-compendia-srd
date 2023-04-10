// adapted from the DFreds (https://github.com/DFreds/dfreds-convenient-effects) Faerie Fire effect
/////

export class FaerieFire {
  static async addEffect() {
    let params = 
    [{
        filterType: "globes",
        filterId: "glowingGlobes",
        time: 0,
        color: 0xca2c92,
        distortion: 0.4,
        scale: 40,
        alphaDiscard: false,
        zOrder: 1,
        animated :
        {
          time : 
          { 
            active: true, 
            speed: 0.0008, 
            animType: "move" 
          }
        }
    },
    {
        filterType: "zapshadow",
        filterId: "myZap",
        alphaTolerance: 0.45,
        rank: 2
    }]
    
    let faerieFire = TokenMagic.getPreset("Faerie Fire");
    if (faerieFire === undefined) {
      await TokenMagic.addPreset("Faerie Fire", params);
    }
  }
}