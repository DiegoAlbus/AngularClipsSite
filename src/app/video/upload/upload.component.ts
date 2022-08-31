import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { v4 as uuid } from 'uuid';
import { last, switchMap } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app'
import { TitleStrategy } from '@angular/router';
import { ClipService } from 'src/app/services/clip.service';
import { Router } from '@angular/router';

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

  constructor(private storage: AngularFireStorage, private auth: AngularFireAuth, private clipsService: ClipService, private router: Router) {
    auth.user.subscribe(user => this.user = user);
  }

  ngOnDestroy(): void {
    this.task?.cancel(); // If the component is destroyed cancels the upload
  }

  storeFile($event: Event){
    this.isDragover = false;

    // We get the first file
    this.file = ($event as DragEvent).dataTransfer?
    ($event as DragEvent).dataTransfer?.files.item(0) ?? null : ($event.target as HTMLInputElement).files?.item(0) ?? null; 
    // If it returns undefined it'll return null

    if (!this.file || this.file.type !== 'video/mp4') {
      return;
    }

    this.title.setValue(
      this.file.name.replace(/\.[^/.]+$/, '')
    );

    this.nextStep = true;
  }

  uploadFile(){
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

    this.task = this.storage.upload(clipPath, this.file);
    const clipRef = this.storage.ref(clipPath); // CREATES REFERENCE TO A FILE

    this.task.percentageChanges().subscribe(progress => {
      this.percentage = progress as number / 100; // BY DEFAULT THE PERCENTAGE PIPE WILL MULTIPLY THE VALUE FOR 100, SO WE DIVIDE
    });

    // TODO Handle errors
    // https://firebase.google.com/docs/storage/web/handle-errors

    this.task.snapshotChanges().pipe(
      last(), // This operator will ignore values pushed by the observable, a value won't be pushed until the observable completes
      switchMap(() => clipRef.getDownloadURL())
    ).subscribe({
      next: async (url) => {
        const clip = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title: this.title.value,
          fileName: `${clipFileName}.mp4`,
          url,
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
