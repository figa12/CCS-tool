/// <reference path="../../../lib/jquery.d.ts" />
/// <reference path="../../../lib/ccs.d.ts" />
/// <reference path="../../../lib/util.d.ts" />
/// <reference path="../gui.ts" />
/// <reference path="../arbor/arbor.ts" />
/// <reference path="../arbor/renderer.ts" />

module GUI.Widget {

    function clamp(val : number, min : number, max : number) {
        return Math.max(Math.min(val, max), min);
    }

    export class ZoomableProcessExplorer {
        private zoomMax = 3;
        private zoomMin = 1;
        private zoomStep = 0.2;
        private zoomDefault = 1;

        private $zoomRange : JQuery;
        private $freezeBtn : JQuery;
        private $depthInput : JQuery;
        private isFrozen = false;
        private root = document.createElement("div");
        private canvasContainer = document.createElement("div");
        private canvas : HTMLCanvasElement = document.createElement("canvas");

        private hoverTimeoutListener : any = null;
        private hoverLeaveListener : any = null;
        private hoverTimeout : any;
        private hoverTimeoutDelay;

        private renderer : Renderer;
        private graphUI : GUI.ProcessGraphUI;
        public succGen : CCS.SuccessorGenerator = null;
        public graph : CCS.Graph = null;
        private currentZoom = 1;
        private expandDepth = 5;

        constructor() {
            $(this.root).addClass("widget-zoom-process-explorer");
            $(this.canvasContainer).addClass("canvas-container").attr("id", "hml-canvas-container");
            this.setupRange();
            this.setupFreezeBtn();
            this.setupDepthInput();

            $(this.canvasContainer).append(this.canvas);

            var $buttons = $('<span class="input-group-btn"></span>').append(this.$freezeBtn);
            var $rightInputs = $('<div class="input-group toolbar"></div>').append(this.$depthInput, $buttons);
            var $toolBarDiv = $('<div class="relative"></div>').append(this.$zoomRange, $rightInputs, this.canvasContainer)
            $(this.root).append($toolBarDiv);

            this.renderer = new Renderer(this.canvas);
            this.graphUI = new ArborGraph(this.renderer);
            this.graphUI.bindCanvasEvents();

            var cancelHoverTimeout = () => {
                if (this.hoverTimeout) {
                    clearTimeout(this.hoverTimeout);
                }
            };

            this.graphUI.setHoverOnListener(processId => {
                cancelHoverTimeout();
                if (this.hoverTimeoutListener != null) {
                    this.hoverTimeout = setTimeout(() => {
                        if (this.hoverTimeoutListener) {
                            this.hoverTimeoutListener.call(this, processId, this.graphUI.getPosition(processId));
                        }
                    }, this.hoverTimeoutDelay);
                }
            });

            this.graphUI.setHoverOutListener(() => {
                cancelHoverTimeout();
                if (this.hoverLeaveListener != null) {
                    this.hoverLeaveListener.call(this);
                }
            });
        }

        getGraphUI(){
            return this.graphUI;
        }

        getRootElement() : HTMLElement {
            return this.root;
        }

        getCanvasContainer() : HTMLElement {
            return this.canvasContainer;
        }

        setExpandDepth(depth : any) {
            if (typeof depth === 'string') {
                depth = parseInt(depth, 10);
            }
            if (depth) {
                depth = Math.round(depth);
            }
            if (!depth || depth < 1 || depth > 20) {
                depth = 10;
            }
            if (depth !== this.expandDepth) {
                this.expandDepth = depth;
                this.clear();
                this.exploreProcess(this.getSelectedProcess());
            }
            this.$depthInput.val(depth);
        }

        setZoom(zoomFactor : number) : void {
            var $canvas = $(this.canvas),
                $root = $(this.root),
                $canvasContainer = $(this.canvasContainer),
                canvasWidth, canvasHeight;
            zoomFactor = clamp(zoomFactor, this.zoomMin, this.zoomMax);
            //TODO
            //By enlarging the canvas but not its containing element we zoom in.

            canvasWidth = $canvasContainer.width() * zoomFactor;
            canvasHeight = $canvasContainer.height() * zoomFactor;
            this.canvas.width = canvasWidth;
            this.canvas.height = canvasHeight;
            this.renderer.resize(canvasWidth, canvasHeight);

            if (zoomFactor > 1) {
                $canvasContainer.css("overflow", "auto");
                this.focusOnProcess(this.succGen.getProcessById(this.graphUI.getSelected()));
            } else {
                $canvasContainer.css("overflow", "hidden");
            }
        }

        /* (un)freeze the graph depending on the lock, called from its parent */
        public clearFreeze(){
            this.toggleFreeze(this.$freezeBtn.data("frozen"));
        }

        private toggleFreeze(freeze : boolean) {
            if (freeze) {
                this.graphUI.freeze();
                this.$freezeBtn.find("i").removeClass("fa-unlock-alt").addClass("fa-lock");
            } else {
                this.graphUI.unfreeze();
                this.$freezeBtn.find("i").removeClass("fa-lock").addClass("fa-unlock-alt");
            }

            //TODO Handle other affected things.
            this.$freezeBtn.data("frozen", freeze);
        }

        private getSelectedProcess() : CCS.Process {
            return this.succGen.getProcessById(this.graphUI.getSelected());
        }

        resize(width, height) : void {
            var $root = $(this.root);
            var $canvasContainer = $(this.canvasContainer);
            height = Math.max(265, height);

            //$root.width(width); // they must be the same size?
            $root.height(height);
            //$canvasContainer.width(width); // they must be the same size?
            $canvasContainer.height(height);

            //Fix zoom
            this.setZoom(this.currentZoom);
        }

        exploreProcess(process : CCS.Process) : void {
            if (!this.succGen) throw "Invalid operation: succGen must be set first";
            this.drawProcessInternal(process, this.expandDepth);
        }

        focusOnProcess(process : CCS.Process) : void {
            var position = this.graphUI.getPosition(process.id.toString()),
                $canvasContainer = $(this.canvasContainer);

            if (position){
                $canvasContainer.scrollLeft(position.x - ($canvasContainer.width() / 2));
                $canvasContainer.scrollTop(position.y - ($canvasContainer.height() / 2));
            }
        }

        clear() : void {
            this.graphUI.clearAll();
        }

        setOnHoverTimeout(callback : (processId, position) => void, msTimeout : number) {
            this.hoverTimeoutDelay = msTimeout;
            this.hoverTimeoutListener = callback;
        }

        setOnHoverLeave(callback : (processId) => void) {
            this.hoverLeaveListener = callback;
        }

        private drawProcessInternal(process : CCS.Process, expandDepth) {
            this.showProcess(process);

            var allTransitions = CCS.expandBFS(process, this.succGen, expandDepth);
            for (var fromId in allTransitions) {
                var fromProcess = this.succGen.getProcessById(fromId);
                this.showProcessAsExplored(fromProcess);
                var groupedByTargetProcessId = ArrayUtil.groupBy(allTransitions[fromId].toArray(), t => t.targetProcess.id);

                Object.keys(groupedByTargetProcessId).forEach(strProcId => {
                    var group = groupedByTargetProcessId[strProcId],
                        data = group.map(t => { return {label: t.action.toString(false)}; }),
                        numId = strProcId;
                    this.showProcess(this.succGen.getProcessById(numId));
                    this.graphUI.showTransitions(fromProcess.id, numId, data);
                });
            }

            this.graphUI.setSelected(process.id.toString());
        }

        public drawProcess(process : CCS.Process) {
            this.drawProcessInternal(process, 1);
        }

        private showProcessAsExplored(process : CCS.Process) : void {
            this.graphUI.showProcess(process.id, {label: this.labelFor(process), status: "expanded"});
        }

        public showProcess(process : CCS.Process) : void {
            //Check already expanded to prevent resetting expand status
            if (!process || this.graphUI.getProcessDataObject(process.id)) return;
            this.graphUI.showProcess(process.id, {label: this.labelFor(process), status: "unexpanded"});
        }

        private labelFor(process : CCS.Process) : string {
            return this.graph.getLabel(process);
        }

        private setupRange() {
            var $range = $("<input></input>");
            $range.prop("type", "range");
            $range.prop("min", this.zoomMin);
            $range.prop("max", this.zoomMax);
            $range.prop("step", this.zoomStep);
            $range.prop("value", this.zoomDefault);
            this.$zoomRange = $range;

            var changeEvent = (navigator.userAgent.indexOf("MSIE ") > 0 ||
                               !!navigator.userAgent.match(/Trident.*rv\:11\./))
                               ? "change" : "input";
            this.$zoomRange.on(changeEvent, () => {
                this.currentZoom = this.$zoomRange.val();
                this.setZoom(this.currentZoom);
                });
        }

        private setupFreezeBtn() {
            var $button = $('<button class="btn btn-default"></button>'),
                $lock = $('<i class="fa fa-lg fa-unlock-alt"></i>');
            $button.data("frozen", false);
            $button.append($lock);
            this.$freezeBtn = $button;
            this.$freezeBtn.on("click", () => this.toggleFreeze(!this.$freezeBtn.data("frozen")));
        }

        private setupDepthInput() {
            var $input = $('<input class="form-control depth-control" value="5" type="text" data-tooltip="depth" />');
            $input.on("change", () => this.setExpandDepth($input.val()));
            this.$depthInput = $input;
        }
    }
}