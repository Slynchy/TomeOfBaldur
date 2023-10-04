import { BaseTexture, Container, Graphics, Sprite, Texture } from "pixi.js";

const PIE_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD4AAAB8CAYAAAAxUQMjAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA6pJREFUeNrsnV+EVGEYxt+dHVFKxLJZSpnIprRK3ZSuGsXaSLGk2KvoKiW66iKlZW+6jlhWo4shYlktSxpFxCqGGIYYhmGIZYnU+7TvyTHNbDt/zsw53/M9PBe71o7fPN//853vG/qlkn/1TV1Tl8xl9ar6q3pNHNBQC/DNVFW/VS+pV+xLogBvVjrwBSya11nAw/quzqsXrFTQgIdVUT9Xz1sbQQMe6KeVgFlrHGnAw8qp56yHoAIP9Fp917rKgSg1oM+dUn9WP1BvY0o8LKR+S73MkHhYGfUb9Uv1HqbEG7vAmX6kn5J4aczSf6QeZko8LKQ+ra6zgQcNXzaKkV9K4i00fO/Vx9nAoVH1O/U5NnBopzV6V1jqeLMJz2Ub8lKBiy10TNriBxV4sOBxVv3F9TreqN1W5zNsiYf7+dOdDHJSkmwh8RedDG+TDg5dsHk9VVEPd3PZdlp6V8AhrO9PbLW+p8Qd7VM/ZUw8EPr3AiP4qnVxP1iKeiBMYe8wJg7hUfZh2VjDo0k8mMY+YUw86NuPSIvnda4mLjaMvceYuFjLfkia7NpwOXEIz+XuMyYOYcXmoGzs3aFJHNquvs6YOFS0Fp4qcWhcfYIRXBqLO0tRh7BTc68NbKgSH1GfZyzq0BRjURcbwe1nTBzLUxlGcOiMByfTKcbGLVig2MGYOBYoxhnBoaOs4AdYwTOs4GOs4KOs4COM/fifvpw18WFWcPHgHtyDe3DfnTmkugcnU8WDk6nMCl5iBS+yLi/vYkwcG/7WGcE/sA5ZC9TgfmMAiRZZp6V/wf12LwLlAmg28IXwD34Tr+Oab/yF36jveNpVtsRpX8bJSYtzY/0Ld46m3fJUUP9SrWN6vBm0q4ljlDYhhC/O3/wftIvgaNAKW/lDl4o66vQxITsOBX32DWnjzCdXwHGSd1vnu7lQ1HGlwaSEVlcYwCmPNcPi4UXp8MDapILj6MKsdHE+exLBMTjBSZ1dncqfNHA0YNPS5QmdSQNH0tfUr3rxz9IJmmZe6kXSSQKvWj/9qZf/NO7g5W5b7yTW8RUbnERypUhcwecs6VpUH5COYX2esfF3pIpT4nmbTy/148PiAF6yMffVKIt2nMDxMO9hP1OOQx3HXpTbQnQJFIabJ21AUhpk/epH4sFFb+iiinFpSaMErxjwM4nh1X69Bl+zbgnr28sSY/UCvGbDy7wk6PrOdIegeFqB7c+4ovOjJFCtwOtWLwOXbFpYlohuo+q3fgswAAMUX7w3K9bnAAAAAElFTkSuQmCC";
const PIE_TEXTURE = new Texture(new BaseTexture(PIE_B64));

export class PieElement extends Container {

    public bgPie: Sprite;
    public fgPie: Sprite;
    public controlPie: Sprite;
    public maskPie: Graphics;

    constructor(
        foregroundColor: number,
        backgroundColor: number,
        texture?: Texture
    ) {
        super();
        const pies = [];
        for(let i = 0; i < 3; i++) {
            const pieImg = new Sprite(texture || PIE_TEXTURE);
            pieImg.anchor.x = 0;
            pieImg.anchor.y = 0.5;
            this.addChild(pieImg);
            pies.push(pieImg);
        }

        this.bgPie = pies[0];
        this.fgPie = pies[1];
        this.controlPie = pies[2];
        this.maskPie = new Graphics();

        this.bgPie.rotation = Math.PI;
        this.bgPie.tint = backgroundColor;
        this.fgPie.tint = foregroundColor;
        this.controlPie.tint = backgroundColor;

        this.maskPie.beginFill(0xfafafa, 1);
        this.maskPie.drawCircle(0, 0, (this.bgPie.width) * 0.7);
        this.maskPie.endFill();
        this.addChild(this.maskPie);
    }

    /**
     *
     * @param _percent 0 to 1
     */
    public setPercent(_percent: number): void {
        _percent = Math.max(0, Math.min(_percent, 1));

        // yes this is a hack.
        let angle = _percent * 359.99;

        while(angle<0) angle+=360;
        angle %= 360;
        this.controlPie.tint = (angle>=180) ? this.fgPie.tint : this.bgPie.tint;

        angle %= 180;
        this.controlPie.rotation = Math.PI * angle/180.0;
    }
}
