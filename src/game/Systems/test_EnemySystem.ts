import { Component, HelperFunctions, System } from "../../tsthree";
import { ENGINE_DEBUG_MODE } from "../../engine/Constants/Constants";
import { tsthreeConfig } from "../../config/tsthreeConfig";
import { Test_EnemyComponent } from "../Components/test_EnemyComponent";

export class Test_EnemySystem extends System {

    public static destroy(_component: Component): void {
        super.destroy(_component);
    }

    public static onAwake(_component: Component): void {
    }

    public static onStep(_dt: number, _component: Test_EnemyComponent): void {
        // Calculate the direction vector from the sprite to the center
        let dx: number = (tsthreeConfig.width * 0.5) - _component.parent.x;
        let dy: number = (tsthreeConfig.height * 0.5) - _component.parent.y;

        // Normalize the direction vector (to get a length of 1)
        let distance: number = Math.sqrt(dx * dx + dy * dy);
        let dirX: number = dx / distance;
        let dirY: number = dy / distance;

        if(distance < 4) {
            _component.parent.visible = false;
            _component.parent.setIsActive(false);
            return;
        }

        // Move the sprite towards the center of the screen with the given speed
        _component.parent.x += dirX * 5 * _dt;
        _component.parent.y += dirY * 5 * _dt;
    }

    public static onDestroy(_component: Component): void {
        super.onDestroy(_component);
    }

    public static onEnable(_component: Component): void {
    }

    public static onDisable(_component: Component): void {
    }
}