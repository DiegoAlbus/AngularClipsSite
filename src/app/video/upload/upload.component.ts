import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { v4 as uuid } from 'uuid';
import { switchMap } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app'
import { TitleStrategy } from '@angular/router';
import { ClipService } from 'src/app/services/clip.service';
import { Router } from '@angular/router';
import { FfmpegService } from 'src/app/services/ffmpeg.service';
import { combineLatest, forkJoin } from 'rxjs';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnDestroy {
  isDragover = false;
  file: File | null = null;
  nextStep = false; // Hides form until there's a file dragged
  showAlert = false;
  alertColor = 'blue';
  alertMsg = 'Please wait! Your clip is being uploaded.';
  inSubmission = false;
  percentage = 0;
  showPercentage = false;
  user: firebase.User | null = null;
  task?: AngularFireUploadTask;
  screenshots: string[] = [];
  selectedScreenshot = "";
  screenshotTask?: AngularFireUploadTask;

  title = new FormControl('', {
    validators: [
      Validators.required,
      Validators.minLength(3)
    ],
    nonNullable: true
  });

  uploadForm = new FormGroup({
    title: this.title
  });

  constructor(private storage: AngularFireStorage, private auth: AngularFireAuth, private clipsService: ClipService, private router: Router,
    public ffmpegService : FfmpegService) {
    auth.user.subscribe(user => this.user = user);
    this.ffmpegService.init();
  }

  ngOnDestroy(): void {
    this.task?.cancel(); // If the component is destroyed cancels the upload
  }

  async storeFile($event: Event){
    if (this.ffmpegService.isRunning) {
      return;
    }
    this.isDragover = false;

    // We get the first file
    this.file = ($event as DragEvent).dataTransfer?
    ($event as DragEvent).dataTransfer?.files.item(0) ?? null : ($event.target as HTMLInputElement).files?.item(0) ?? null; 
    // If it returns undefined it'll return null

    if (!this.file || this.file.type !== 'video/mp4') {
      return;
    }

    this.screenshots = await this.ffmpegService.getScreenshot(this.file);
    this.selectedScreenshot = this.screenshots[0];

    this.title.setValue(
      this.file.name.replace(/\.[^/.]+$/, '')
    );

    this.nextStep = true;
  }

  async uploadFile(){
    this.uploadForm.disable(); // Disable controls on the form group

    this.showAlert = true;
    this.alertColor = 'blue';
    this.alertMsg = 'Please wait! Your clip is being uploaded.';
    this.inSubmission = true;
    this.showPercentage = true;

    const clipFileName = uuid();

    // https://www.npmjs.com/package/uuid
    const clipPath = `clips/${clipFileName}.mp4`;
    // console.log('File uploaded.');

    const screenshotBlob = await this.ffmpegService.blobFromURL(
      this.selectedScreenshot
    );

    const screenshotPath = `screenshots/${clipFileName}.png`;

    // UPLOADING VIDEO
    this.task = this.storage.upload(clipPath, this.file);
    const clipRef = this.storage.ref(clipPath); // CREATES REFERENCE TO A FILE

    // UPLOAD SCREENSHOT
    this.screenshotTask = this.storage.upload(screenshotPath, screenshotBlob);

    const screenshotRef = this.storage.ref(screenshotPath);

    combineLatest([
      this.task.percentageChanges(),
      this.screenshotTask.percentageChanges()
    ]).subscribe((progress) => {
      const[clipProgress, screenshotProgress] = progress;

      if (!clipProgress || !screenshotProgress){
        return;
      }

      const total = clipProgress + screenshotProgress

      this.percentage = total as number / 200; // BY DEFAULT THE PERCENTAGE PIPE WILL MULTIPLY THE VALUE FOR 100, SO WE DIVIDE
    });

    // TODO Handle errors
    // https://firebase.google.com/docs/storage/web/handle-errors

    forkJoin([
      this.task.snapshotChanges(),
      this.screenshotTask.snapshotChanges()
    ]).pipe(
      // last(), // This operator will ignore values pushed by the observable, a value won't be pushed until the observable completes
      switchMap(() => forkJoin([
        clipRef.getDownloadURL(), 
        screenshotRef.getDownloadURL()
      ]))).subscribe({
      next: async (urls) => {
        const [clipURL, screenshotURL] = urls;

        const clip = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title: this.title.value,
          fileName: `${clipFileName}.mp4`,
          url: clipURL,
          screenshotURL,
          screenshotFileName: `${clipFileName}.png`,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        const clipDocRef = await this.clipsService.createClip(clip);
        console.log(clip);

        this.alertColor = 'green';
        this.alertMsg = 'Success! Your clip is now ready to share with the world.';
        this.showPercentage = false;

        setTimeout(() => {
          this.router.navigate([
            'clip',
            clipDocRef.id // ID OF THE VIDEO
          ])
        }, 1000);
      },
      error: (error) => {
        this.uploadForm.enable(); // Enable controls on the form group

        this.alertColor = 'red';
        this.alertMsg = 'Upload failed! Please try again later.';
        this.inSubmission = true;
        this.showPercentage = false;
        console.error(error);
      }
    });
  }

}
