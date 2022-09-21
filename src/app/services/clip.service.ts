import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, DocumentReference, QuerySnapshot } from '@angular/fire/compat/firestore';
import IClip from '../models/clip.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { switchMap, of, map, BehaviorSubject, combineLatest } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Injectable({
  providedIn: 'root'
})
export class ClipService {
  public clipsCollection: AngularFirestoreCollection <IClip>;

  constructor(
    private db : AngularFirestore,
    private auth: AngularFireAuth,
    private storage : AngularFireStorage
  ) {
    this.clipsCollection = db.collection('clips');
  }

  async createClip(data: IClip) : Promise<DocumentReference<IClip>>{
    return this.clipsCollection.add(data);
  }

  getUserClips(sort$ : BehaviorSubject<string>) {
    return combineLatest([this.auth.user, sort$]).pipe(
      switchMap(values => {

        const[user, sort] = values;

        if (!user) {
          return of([]);
        }

        // QUERY SEARCH FOR CLIPS WITH THE SAME UID AS THE USER
        const query = this.clipsCollection.ref.where(
          'uid', '==', user.uid
        ).orderBy(
          'timestamp', sort === '1' ? 'desc' : 'asc'
        );

        return query.get();
      }),
      map(snapshot => (snapshot as QuerySnapshot<IClip>).docs) // WE MAP THE DOCS SO WE CAN FOCUS ONLY ON THEM
    );
  }

  updateClip(id: string, title: string){
     // SELECT DOC BY ID AND UPDATE
    this.clipsCollection.doc(id).update({
      title
    });
  }

  async deleteClip(clip : IClip){
    // DELETE FROM DB
    // https://firebase.google.com/docs/storage/web/delete-files

    const clipRef = this.storage.ref(`clips/${clip.fileName}`);
    const screenshotRef = this.storage.ref(`screenshots/${clip.screenshotFileName}`);

    await clipRef.delete();
    await screenshotRef.delete();

    await this.clipsCollection.doc(clip.docID).delete();
  }

}
