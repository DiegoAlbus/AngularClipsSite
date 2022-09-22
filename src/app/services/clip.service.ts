import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, DocumentReference, QuerySnapshot } from '@angular/fire/compat/firestore';
import IClip from '../models/clip.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { switchMap, of, map, BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot, Router } from '@angular/router';
import { ThisReceiver } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class ClipService implements Resolve<IClip | null> {
  public clipsCollection: AngularFirestoreCollection <IClip>;
  pageClips: IClip[] = [];
  pendingReq = false;

  constructor(
    private db : AngularFirestore,
    private auth: AngularFireAuth,
    private storage : AngularFireStorage,
    private router: Router
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

  async getClips(){

    if (this.pendingReq) {
      return;
    }

    this.pendingReq = true;

    // GETS 6 MOST RECENT CLIPS
    let query = this.clipsCollection.ref.orderBy('timestamp','desc').limit(6);

    const { length } = this.pageClips;

    // RECEIVE THE FOLLOWING 6 RESULTS
    if (length) {
      const lastDocID = this.pageClips[length - 1].docID;
      const lastDoc = await this.clipsCollection.doc(lastDocID).get().toPromise();

      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    snapshot.forEach(doc => {
      this.pageClips.push({
        docID: doc.id,
        ...doc.data()
      })
    });

    this.pendingReq = false;
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): IClip | Observable<IClip | null> | Promise<IClip | null> | null {
    return this.clipsCollection.doc(route.params.id).get().pipe(
      map(snapshot => {
        const data = snapshot.data();

        if (!data){
          this.router.navigate(['/']);
          return null;
        }

        return data;
      })
    );
  }

}
