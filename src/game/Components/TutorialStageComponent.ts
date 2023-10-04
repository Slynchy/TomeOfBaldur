import { Component, GameObject, System } from "../../tsthree";
import { TutorialStageSystem } from "../Systems/TutorialStageSystem";

export interface ITutorialStageConfig {
    id: string; // arbitrary, just for tracking
}

export class TutorialStageComponent extends Component {

    public static instances: Array<TutorialStageComponent> = [];
    public static readonly id: string = "TutorialStageComponent";
    protected _parent: GameObject;
    protected static readonly _system: typeof TutorialStageSystem = TutorialStageSystem;
    public tutorialStageId: string;
    public onActivate: () => void = null;

    public get isActive(): boolean { return Boolean(this.onActivate); }

    constructor(_config: ITutorialStageConfig) {
        super();
        this.tutorialStageId = _config.id;
    }

    onAttach(): void {
        TutorialStageComponent.instances.push(this);
    }

    onComponentAttached(_componentId: string, _component: Component): void {
    }

    onDetach(): void {
        TutorialStageComponent.instances.splice(
            TutorialStageComponent.instances.indexOf(this),
            1
        );
    }
}