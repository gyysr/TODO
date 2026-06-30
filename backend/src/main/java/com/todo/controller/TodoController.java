package com.todo.controller;

import com.todo.model.Todo;
import com.todo.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/todos")
@CrossOrigin(origins = "*")
public class TodoController {

    @Autowired
    private TodoRepository todoRepository;

    // 查询所有待办
    @GetMapping
    public List<Todo> getAllTodos(
            @RequestParam(required = false) Boolean completed) {
        if (completed != null) {
            return todoRepository.findByCompletedOrderByCreatedAtDesc(completed);
        }
        return todoRepository.findAllByOrderByCreatedAtDesc();
    }

    // 根据 ID 查询
    @GetMapping("/{id}")
    public ResponseEntity<Todo> getTodoById(@PathVariable Long id) {
        return todoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 新增待办
    @PostMapping
    public Todo createTodo(@RequestBody Todo todo) {
        todo.setId(null);
        return todoRepository.save(todo);
    }

    // 更新待办
    @PutMapping("/{id}")
    public ResponseEntity<Todo> updateTodo(
            @PathVariable Long id,
            @RequestBody Todo todoDetails) {
        return todoRepository.findById(id)
                .map(todo -> {
                    if (todoDetails.getTitle() != null) {
                        todo.setTitle(todoDetails.getTitle());
                    }
                    if (todoDetails.getDescription() != null) {
                        todo.setDescription(todoDetails.getDescription());
                    }
                    if (todoDetails.getCompleted() != null) {
                        todo.setCompleted(todoDetails.getCompleted());
                    }
                    return ResponseEntity.ok(todoRepository.save(todo));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 删除待办
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id) {
        return todoRepository.findById(id)
                .map(todo -> {
                    todoRepository.delete(todo);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
