package com.todo.controller;

import com.todo.model.Note;
import com.todo.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "*")
public class NoteController {

    @Autowired
    private NoteRepository noteRepository;

    @GetMapping
    public List<Note> getAllNotes() {
        return noteRepository.findAllByOrderByUpdatedAtDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Note> getNoteById(@PathVariable Long id) {
        return noteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Note createNote(@RequestBody Note note) {
        note.setId(null);
        return noteRepository.save(note);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Note> updateNote(
            @PathVariable Long id,
            @RequestBody Note noteDetails) {
        return noteRepository.findById(id)
                .map(note -> {
                    if (noteDetails.getTitle() != null) {
                        note.setTitle(noteDetails.getTitle());
                    }
                    if (noteDetails.getContent() != null) {
                        note.setContent(noteDetails.getContent());
                    }
                    return ResponseEntity.ok(noteRepository.save(note));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id) {
        return noteRepository.findById(id)
                .map(note -> {
                    noteRepository.delete(note);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
