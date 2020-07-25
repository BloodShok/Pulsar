import { Component, OnInit, HostListener, Input, AfterContentInit } from '@angular/core';
import { element } from 'protractor';
import * as HLS from 'hls.js';
@Component({
    selector: 'app-stream-player',
    templateUrl: './stream-player.component.html',
    styleUrls: ['./stream-player.component.scss'],
})
export class StreamPlayerComponent implements OnInit, AfterContentInit {
    constructor() { }
    isVideoHeightStatic = false;
    changedWidth = 0;
    @Input() channelSource: string;


    videoElement: HTMLMediaElement;
    isEmailConfirmationMessage = false;
    hls: HLS;
    ngAfterContentInit() {
        this.videoElement = document.getElementById(
            'videoP'
        ) as HTMLMediaElement;
        this.hls = new HLS();
        this.hls.loadSource(this.channelSource);
        this.hls.attachMedia(this.videoElement);
        this.hls.on(HLS.Events.MANIFEST_PARSED, () => this.videoElement.play());
    }

    ngOnInit(): void { }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        if (document.getElementById('videoP').clientHeight >= 548) {
            this.isVideoHeightStatic = true;
        } else {
            this.isVideoHeightStatic = false;
        }
    }
}